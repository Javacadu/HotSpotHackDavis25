# Install dependencies first: pip install fastapi uvicorn requests pandas

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import requests
import pandas as pd
from io import StringIO
import logging
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

from typing import Optional, Union
from pydantic import BaseModel

class Demographics(BaseModel):
    geographic_area_name: Optional[str] = None
    median_household_income_2019_usd: Optional[Union[float, str]] = None
    population_below_poverty_level: Optional[Union[float, str]] = None
    white_alone_population: Optional[Union[float, str]] = None
    black_or_african_american_alone_population: Optional[Union[float, str]] = None
    hispanic_or_latino_population_any_race: Optional[Union[float, str]] = None
    total_population: Optional[Union[float, str]] = None
    males_age_6566: Optional[Union[float, str]] = None
    people_with_disability_1864: Optional[Union[float, str]] = None
    housing_units_built_2010_or_later: Optional[Union[float, str]] = None
    vacant_housing_units: Optional[Union[float, str]] = None
    people_age_5_who_speak_english_less_than_very_well: Optional[Union[float, str]] = None
    state_fips_code: Optional[str] = None
    county_fips_code: Optional[str] = None
    census_tract_code: Optional[str] = None


import os
import google.generativeai as genai

# Always use getenv() safely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Ensure this is set in your environment
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize model PROPERLY for Gemini 2.0 Flash
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-001",  # Official model ID as of 2025
    generation_config={
        "temperature": 0.5,
        "max_output_tokens": 2048,
    },
    safety_settings={
        "HATE": "BLOCK_NONE",
        "HARASSMENT": "BLOCK_NONE",
    }
)



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

@app.post("/get-services/")
async def get_services(demographics: Demographics):
    print(demographics)
    prompt = f"""
Given these demographics: {demographics.model_dump()}
THESE DEMOGRAPHICS ARE IMPORTANT! Make sure each one is served well, order the list from the most important for that specific community to the least important.
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

You are an API that only responds in JSON format. 
Provide your answer as a valid JSON object, with no extra commentary, explanation, or markdown. 
Here is the required structure:
- name
- explanation
- accessibility
- link

Here are some examples:

Example 1:
Demographics: {{
    "geographic_area_name": "Rural California",
    "median_household_income_2019_usd": 32000,
    "population_below_poverty_level": 35,
    "total_population": 1200,
    "people_with_disability_1864": 120
}}

Output:
{{
  "services": [
    {{
      "name": "CalFire Emergency Alerts",
      "explanation": "Stay safe with real-time wildfire alerts and evacuation info.",
      "accessibility": "Available via SMS and phone for those without internet.",
      "link": "https://www.fire.ca.gov/programs/communications/"
    }},
    {{
      "name": "Rural Recovery Counseling",
      "explanation": "Talk to someone who understands rural life and tough losses.",
      "accessibility": "Free hotline and local in-person sessions.",
      "link": "https://www.ruralcounseling.org/"
    }},
    {{
      "name": "Red Cross Temporary Shelters",
      "explanation": "Find a safe place to stay and recover after disaster.",
      "accessibility": "No ID needed, open 24/7.",
      "link": "https://www.redcross.org/get-help.html"
    }}
  ]
}}

Example 2:
Demographics: {{
    "geographic_area_name": "Urban Latino Community",
    "median_household_income_2019_usd": 45000,
    "hispanic_or_latino_population_any_race": 8000,
    "people_age_5_who_speak_english_less_than_very_well": 1200
}}

Output:
{{
  "services": [
    {{
      "name": "Alerta Incendios en Español",
      "explanation": "Recibe alertas de incendios y evacuaciones en tu idioma.",
      "accessibility": "Mensajes de texto y llamadas automáticas disponibles.",
      "link": "https://www.alerta-incendios.org/"
    }},
    {{
      "name": "Consejería Comunitaria",
      "explanation": "Habla con un consejero que entiende tu cultura y situación.",
      "accessibility": "Sesiones gratuitas en español, virtuales o presenciales.",
      "link": "https://www.consejeriaciudad.org/"
    }}
  ]
}}
Now, for the following input, respond ONLY with a JSON object in the above format.
Output:
"""

                
    try:
        response = model.generate_content(
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            request_options={"timeout": 10}  # Prevent hanging
        )
        return response.text
    except genai.types.StopCandidateException as e:
        return f"Error: {e}"
    except Exception as e:
        return f"API Error: {str(e)}"


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
            return map_and_snake_case_demographics(df_demo.to_dict(orient='records'), code_to_name)
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
                demo_list = map_and_snake_case_demographics(df_demo.to_dict(orient='records'), code_to_name)
                demographics.extend(demo_list)
                return {
                    "fires": high_confidence_fires.to_dict(orient='records'),
                    "demographics": demographics,
                    "errors": errors
                }
    

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
