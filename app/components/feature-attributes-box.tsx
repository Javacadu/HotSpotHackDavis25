import React from "react";

interface CensusTractData {
    geographic_area_name?: string;
    median_household_income_2019_usd?: string | number;
    population_below_poverty_level?: string | number;
    white_alone_population?: string | number;
    black_or_african_american_alone_population?: string | number;
    hispanic_or_latino_population_any_race?: string | number;
    total_population?: string | number;
    males_age_6566?: string | number;
    people_with_disability_1864?: string | number;
    housing_units_built_2010_or_later?: string | number;
    vacant_housing_units?: string | number;
    people_age_5_who_speak_english_less_than_very_well?: string | number;
    state_fips_code?: string;
    county_fips_code?: string;
    census_tract_code?: string;
}

export default function Features(props: CensusTractData) {
    const hasData = Object.values(props).some(v => v !== undefined && v !== null && v !== "");

    return (
        <div className="absolute top-0 right-0 p-6 bg-white rounded-lg shadow-lg font-sans text-xs min-w-[180px] max-w-xs border border-gray-200 z-50 m-2">
            <div className="mb-1 text-sm font-semibold tracking-wide text-black">
                {hasData ? "Feature Details" : "No Feature Selected"}
            </div>

            {hasData ? (
                <div className="space-y-0.5 text-gray-500">
                    <div><span className="font-bold">Geographic Area:</span> {props.geographic_area_name}</div>
                    <div><span className="font-bold">Median Income:</span> {props.median_household_income_2019_usd}</div>
                    <div><span className="font-bold">Population Below Poverty:</span> {props.population_below_poverty_level}</div>
                    <div><span className="font-bold">White Population:</span> {props.white_alone_population}</div>
                    <div><span className="font-bold">Black Population:</span> {props.black_or_african_american_alone_population}</div>
                    <div><span className="font-bold">Hispanic Population:</span> {props.hispanic_or_latino_population_any_race}</div>
                    <div><span className="font-bold">Total Population:</span> {props.total_population}</div>
                    <div><span className="font-bold">State FIPS:</span> {props.state_fips_code}</div>
                    <div><span className="font-bold">County FIPS:</span> {props.county_fips_code}</div>
                    <div><span className="font-bold">Census Tract:</span> {props.census_tract_code}</div>
                </div>
            ) : (
                <div className="text-gray-500 text-sm">Hover/click on a feature to view details</div>
            )}

            <div className="mt-4 text-xs text-gray-400">
                Last updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
}
