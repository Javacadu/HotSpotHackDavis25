from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from google import genai
import requests
import pandas as pd
from io import StringIO
import logging
from dotenv import load_dotenv
import os

load_dotenv() 

app = FastAPI()
client = genai.Client(api_key=f"{os.getenv("GEMINI_API_KEY")}")

import re

code_to_name = {
    "NAME": "Geographic Area Name",
    "B19013_001E": "Median Household Income (2019 USD)",
    "B17001_002E": "Population Below Poverty Level",
    "B02001_002E": "White Alone Population",
    "B02001_003E": "Black or African American Alone Population",
    "B03002_012E": "Hispanic or Latino Population (Any Race)",
    "B01001_001E": "Total Population",
    "B01001_020E": "Males Age 65-66",
    "B18101_004E": "People with Disability (18-64)",
    "B25034_010E": "Housing Units Built 2010 or Later",
    "B25002_003E": "Vacant Housing Units",
    "B16004_006E": "People Age 5+ Who Speak English Less Than 'Very Well'",
    "state": "State FIPS Code",
    "county": "County FIPS Code",
    "tract": "Census Tract Code"
}


def to_snake_case(text):
    # Replace non-letter/digit with space, then convert to snake_case
    text = re.sub(r"[^\w\s]", '', text)
    text = re.sub(r"\s+", '_', text.strip())
    return text.lower()

def map_and_snake_case_demographics(demographics, mapping):
    mapped_list = []
    for entry in demographics:
        mapped_entry = {}
        for key, value in entry.items():
            mapped_name = mapping.get(key, key)
            snake_name = to_snake_case(mapped_name)
            mapped_entry[snake_name] = value
        mapped_list.append(mapped_entry)
    return mapped_list


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/census-data-from-location")
async def get_census_from_location(state: str, county: str, tract: str):
    try:
        # Validate input parameters
        if not all([state, county, tract]):
            raise HTTPException(
                status_code=400,
                detail="State, county, and tract parameters are required"
            )

        # Build Census API URL
        variables = "NAME,B19013_001E,B17001_002E,B02001_002E,B02001_003E,B03002_012E,B01001_001E,B01001_020E,B18101_004E,B25034_010E,B25002_003E,B16004_006E"
        census_api_url = (
            f"https://api.census.gov/data/2023/acs/acs5?get={variables}"
            f"&for=tract:{tract}&in=state:{state}&in=county:{county}"
            f"&key={os.getenv("CENSUS_API_KEY")}"
        )

        # Make API request with timeout
        headers = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
        demo_response = requests.get(census_api_url, headers=headers, timeout=10)
        
        # Check for HTTP errors
        demo_response.raise_for_status()

        # Validate response format
        demographic_data = demo_response.json()
        if not isinstance(demographic_data, list) or len(demographic_data) < 2:
            raise HTTPException(
                status_code=502,
                detail="Invalid response format from Census API"
            )

        # Process data
        try:
            df_demo = pd.DataFrame(demographic_data[1:], columns=demographic_data[0])
            demographics = map_and_snake_case_demographics(df_demo.to_dict(orient='records'), code_to_name)
            prompt = f"""
    Given these demographics: {demographics}
    THESE DEMOGRAPHICS ARE IMPORTANT! Make sure each one is served well, order the list from the most important for that specific community to the least important
    DO NOT answer in a long paragraph; SHORT answers only.
    GIVE an explanation of the service. Be sure it is in the language of the type of person it is trying to help.
    MAKE sure each service is easily accessible.

    Suggest relevant online services with: 
    - Emergency support after wildfires
    - Counseling after tough losses
    - Ways to get back up and running
    - Shelters to stay in to recoup and get better
    - Food banks 
    - Monetary needs 
    - Building community after a traumatic event.
    - 
    Output as JSON with 'services' array containing objects with those fields.
    
    """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )

            demographics.services = response.text

            return demographics
    

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Data processing error: {str(e)}"
            ) from e

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Census API request failed: {str(e)}"
        ) from e
    except HTTPException:
        # Re-raise already handled exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@app.get("/fires", summary="Get fire data with demographic information")
async def get_fires():
    """Retrieve current fire data in California with associated demographic information"""
    try:
        # Get fire data from NASA FIRMS API
        fire_url = "http://firms.modaps.eosdis.nasa.gov/api/area/csv/dcd40d35b6f06794337224cbbfad055d/VIIRS_SNPP_NRT/-124.4,32.5,-114.1,42/1/2025-04-19"
        fire_response = requests.get(fire_url)
        
        if fire_response.status_code != 200:
            logger.error(f"NASA API failed with status {fire_response.status_code}")
            raise HTTPException(
                status_code=fire_response.status_code,
                detail="Failed to fetch fire data from NASA API"
            )

        # Process fire data
        try:
            csv_buffer = StringIO(fire_response.text)
            df_fires = pd.read_csv(csv_buffer)
            high_confidence_fires = df_fires[df_fires['confidence'] == 'h']
            coordinate_list = list(zip(
                high_confidence_fires['latitude'], 
                high_confidence_fires['longitude']
            ))
        except Exception as e:
            logger.error("Error processing fire data", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Fire data processing error: {str(e)}"
            )

        processed_fips = set()
        demographics = []
        errors = []

        # Process each coordinate
        for idx, (lat, lon) in enumerate(coordinate_list):
            try:
                # Get census block data
                census_block_url = f"https://geo.fcc.gov/api/census/block/find?latitude={lat}&longitude={lon}&censusYear=2020&format=json"
                census_block_response = requests.get(census_block_url)
                
                if census_block_response.status_code != 200:
                    errors.append(f"Coordinate {idx+1}: Census block API failed")
                    continue

                census_data = census_block_response.json()
                FIPS_string = census_data.get("Block", {}).get("FIPS")
                if FIPS_string in processed_fips:
                    continue
                processed_fips.add(FIPS_string)
                
                if not FIPS_string or len(FIPS_string) < 11:
                    errors.append(f"Coordinate {idx+1}: Invalid FIPS string")
                    continue

                

                # Extract geographic codes
                state = FIPS_string[0:2]
                county = FIPS_string[2:5]
                tract = FIPS_string[5:11]

                # Get demographic data
                variables = "NAME,B19013_001E,B17001_002E,B02001_002E,B02001_003E,B03002_012E,B01001_001E,B01001_020E,B18101_004E,B25034_010E,B25002_003E,B16004_006E"
                census_api_url = f"https://api.census.gov/data/2023/acs/acs5?get={variables}&for=tract:{tract}&in=state:{state}&in=county:{county}&key={os.getenv("CENSUS_API_KEY")}"
                
                headers = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
                demo_response = requests.get(census_api_url, headers=headers)
                
                if demo_response.status_code != 200:
                    errors.append(f"Coordinate {idx+1}: Census API failed")
                    continue

                # Process demographic data
                demographic_data = demo_response.json()
                df_demo = pd.DataFrame(demographic_data[1:], columns=demographic_data[0])
                mapped_demographics = map_and_snake_case_demographics(df_demo.to_dict(orient='records'), code_to_name)
                demographics.extend(mapped_demographics)

            except Exception as e:
                errors.append(f"Coordinate {idx+1}: {str(e)}")
                continue

        return {
            "fires": high_confidence_fires.to_dict(orient='records'),
            "demographics": demographics,
            "errors": errors
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Unexpected error occurred", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error("Unhandled exception occurred", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
