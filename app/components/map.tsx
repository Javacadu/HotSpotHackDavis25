'use client'; // If using Next.js 13+ app directory

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Features from './feature-attributes-box';
import ServicesDropdown from './services-dropdown';
import 'mapbox-gl/dist/mapbox-gl.css';
const baseLineLayer = "1"
const fillLayer = "2"
const fireLayer = "3"

interface FeaturesProps {
    ALAND?: string | number;
    AWATER?: string | number;
    COUNTYFP?: string;
    FUNCSTAT?: string;
    GEOID?: string;
    GEOIDFQ?: string;
    INTPTLAT?: string;
    INTPTLON?: string;
    MTFCC?: string;
    NAME?: string;
    NAMELSAD?: string;
    STATEFP?: string;
    TRACTCE?: string;
}

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

interface ServiceType {
    name: string;
    explanation: string;
    accessibility: string;
    link: string;
}

export default function MapboxMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [featureData, setFeatureData] = useState<CensusTractData | null>(null)
    const [fireTracts, setFireTracts] = useState<string[] | null>([])
    const map = useRef<mapboxgl.Map | null>(null); // Ref to store the map
    const [services, setServices] = useState<ServiceType[]>([]);

    useEffect(() => {

        const controller = new AbortController();
        function fetchFireData() {
            fetch("http://localhost:8000/fires", {
                method: "GET",
                headers: {
                    "ngrok-skip-browser-warning": "true" // Any value works here
                },
                signal: controller.signal
            })
                .then((response) => response.json())
                .then((data) => {
                    const currentMap = map.current
                    data.fires.forEach((element: { latitude: number; longitude: number }) => {
                        if (currentMap) {
                            new mapboxgl.Marker().setLngLat([element.longitude, element.latitude]).addTo(currentMap)
                        }
                    })

                    const demographics = data.demographics
                    demographics.forEach((element: unknown) => {
                        const tract = element as CensusTractData;
                        const stateName = tract.state_fips_code
                        const countName = tract.county_fips_code
                        const tractName = tract.census_tract_code
                        if (tract && stateName && countName && tractName) {
                            setFireTracts((prev: string[] | null) => {
                                return [...new Set([...(prev || []), stateName + countName + tractName].filter((code): code is string => code !== undefined))];
                            });

                        }
                    });

                })
        }

        fetchFireData()

        return () => {
            controller.abort()
        }

    }, [])

    useEffect(() => {
        map.current?.setFilter(fireLayer, [
            'in',
            ['get', 'GEOID'],
            ['literal', fireTracts]
        ]);
    }, [fireTracts])

    useEffect(() => {
        if (!mapContainer.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY!;

        // Prevent SSR issues
        if (typeof window === 'undefined') return;

        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-119.417931, 36.778259], // California center [lng, lat]
            zoom: 6, // 5-6 is good for showing the whole state
        });

        newMap.on('load', () => {
            // Add your tileset as a source
            newMap.addSource('ca_tracts-0zmems', {
                type: 'vector',
                url: 'mapbox://javacadu.8iuxojc2', // Replace with your actual tileset ID
                promoteId: 'GEOID',
            });

            let hoveredId: string | undefined = undefined;

            newMap.on('mousemove', fillLayer, (e: mapboxgl.MapLayerMouseEvent) => {
                if (e.features && e.features.length > 0) {
                    if (hoveredId !== null) {
                        newMap.setFeatureState(
                            { source: 'ca_tracts-0zmems', sourceLayer: 'ca_tracts-0zmems', id: hoveredId },
                            { hover: false }
                        );
                    }
                    const props = e.features[0].properties as FeaturesProps
                    hoveredId = props.GEOID
                    newMap.setFeatureState(
                        { source: 'ca_tracts-0zmems', sourceLayer: 'ca_tracts-0zmems', id: hoveredId },
                        { hover: true }
                    );
                }
            });

            newMap.on('click', fillLayer, async (e: mapboxgl.MapLayerMouseEvent) => {
                if (e.features && e.features.length > 0) {
                    const props = e.features[0].properties as FeaturesProps
                    const geoid = props.GEOID
                    if (geoid) {
                        const state = geoid.substring(0, 2)      // First 2 digits
                        const county = geoid.substring(2, 5)     // Next 3 digits (positions 2-4)
                        const tract = geoid.substring(5, 11)    // Next 6 digits (positions 5-10)
                        const params = new URLSearchParams({ state, county, tract });
                        fetch(`http://localhost:8000/census-data-from-location?${params.toString()}`, {
                            method: "GET",
                            headers: {
                                "ngrok-skip-browser-warning": "true" // Bypass ngrok warning
                            }
                        })
                            .then(response => response.json())
                            .then((data) => {
                                const demographics = data
                                demographics.forEach((element: unknown) => {
                                    const tract = element as CensusTractData;
                                    setFeatureData(tract)
                                })
                            })

                    }
                }
            })

            newMap.on('mouseleave', fillLayer, () => {
                if (hoveredId !== null) {
                    newMap.setFeatureState(
                        { source: 'ca_tracts-0zmems', sourceLayer: 'ca_tracts-0zmems', id: hoveredId },
                        { hover: false }
                    );
                }
                hoveredId = undefined;
            });


            // Add a layer that uses your tileset
            newMap.addLayer({
                'id': baseLineLayer,
                'type': 'line', // Choose the appropriate type (fill, line, circle, symbol)
                'source': 'ca_tracts-0zmems',
                'source-layer': 'ca_tracts-0zmems', // The layer name within your tileset
                'paint': {
                    'line-width': 0.875,
                    'line-color': "#808080",
                }
            });

            // Add a layer that uses your tileset
            newMap.addLayer({
                'id': fillLayer,
                'type': 'fill', // Choose the appropriate type (fill, line, circle, symbol)
                'source': 'ca_tracts-0zmems',
                'source-layer': 'ca_tracts-0zmems', // The layer name within your tileset
                'paint': {
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        0.25,    // Opacity when hovered
                        0,  // Opacity when not hovered
                    ],

                }
            });

            // Add a layer that uses your tileset
            newMap.addLayer({
                'id': fireLayer,
                'type': 'fill', // Choose the appropriate type (fill, line, circle, symbol)
                'source': 'ca_tracts-0zmems',
                'source-layer': 'ca_tracts-0zmems', // The layer name within your tileset
                'paint': {
                    'fill-color': "#DC143C",
                    'fill-opacity': 0.5,

                }
            });
        });

        // Optional: Add navigation controls
        newMap.addControl(new mapboxgl.NavigationControl());
        newMap.setPitch(0);
        newMap.dragRotate.disable();

        map.current = newMap

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    useEffect(() => {
        function getServices(demographic: CensusTractData | null) {
            fetch("http://localhost:8000/get-services/", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demographic),
            }).then(response => response.json())
                .then(result => {
                    if (result) {
                        console.log(result)
                        services.forEach((element: ServiceType) => {
                            setServices(prev => [...(prev || []), element]);
                        })

                    }

                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }

        getServices(featureData)
    }, [featureData])

    return (
        <div className="relative w-100% h-[900px] top-0" >
            <p>These are the fires: {fireTracts}</p>
            <div ref={mapContainer} style={{ width: "100%", height: "300px" }}>

            </div>
            {featureData ? <Features {...featureData} /> : ""}

        </div>

    );


}
