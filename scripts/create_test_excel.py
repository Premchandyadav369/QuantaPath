import pandas as pd

# Create a dataframe
data = {
    'Name': ['Hub 1', 'Hub 2', 'Electronics Store', 'Pharmacy', 'Grocery Market', 'Restaurant', 'Hardware Store', 'Bookstore'],
    'Lat': [16.5062, 16.55, 16.515, 16.498, 16.51, 16.522, 16.54, 16.56],
    'Lng': [80.648, 80.7, 80.655, 80.642, 80.635, 80.651, 80.71, 80.69],
    'IsDepot': [True, True, False, False, False, False, False, False]
}
df = pd.DataFrame(data)

# Create an excel file
df.to_excel('locations.xlsx', index=False)

print("Successfully created 'locations.xlsx'")
