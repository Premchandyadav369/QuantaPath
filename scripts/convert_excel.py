import pandas as pd
import json
import os

# Define the paths
excel_file_path = 'locations.xlsx'
json_file_path = 'stops.json'

# Check if the excel file exists
if not os.path.exists(excel_file_path):
    print(f"Error: '{excel_file_path}' not found. Please create it with the required data.")
else:
    # Read the excel file
    df = pd.read_excel(excel_file_path)

    # Convert the dataframe to a list of dictionaries
    stops = []
    for index, row in df.iterrows():
        stop = {
            'id': f"stop{index}",
            'name': row['Name'],
            'lat': row['Lat'],
            'lng': row['Lng'],
            'isDepot': bool(row['IsDepot'])
        }
        stops.append(stop)

    # Write the data to a json file
    with open(json_file_path, 'w') as f:
        json.dump(stops, f, indent=2)

    print(f"Successfully converted '{excel_file_path}' to '{json_file_path}'")
