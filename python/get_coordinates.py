import requests
import time
import csv

with open("./geonames_username.txt", encoding="utf-8") as file:
    geonames_username = file.read().strip()

def get_coordinates(place, username=geonames_username, fuzzy=0, timeout=1.5, more_args={}):
  """This function gets a single set of coordinates from the geonames API.

  Args:
    place (str): the place name
    username (str): your geonames user name
    fuzzy (int): 0 = exact matching, 1 = fuzzy matching (allow similar but not exact matches)
    timeout (int): number of seconds to wait before a call to the geonames API
      (to avoid being blocked for overloading the server)
    more_args (dict): additional parameters for the API call

  Returns:
    dictionary: keys: latitude, longitude
  """
  # wait a short while, so that we don't overload the server:
  time.sleep(timeout)
  # make the API call:
  url = "http://api.geonames.org/searchJSON?"
  params = {"q": place, "username": username, "fuzzy": fuzzy, "maxRows": 1, "isNameRequired": True}
  if more_args:
    params.update(more_args)
  response = requests.get(url, params=params)
  # convert the response into a dictionary:
  results = response.json()
  # get the first result:
  try:
    result = results["geonames"][0]
    return {"latitude": result["lat"], "longitude": result["lng"]}
  except (IndexError, KeyError):
    print("No results found for your API call", response.request.url)

input_file = "../work-in-progress/data/msData.tsv"
cache = set()
with open(input_file, mode="r", encoding="utf-8") as file:
    reader = csv.DictReader(file, delimiter="\t")

    output_file = "../work-in-progress/data/library_coordinates.tsv"
    with open(output_file, "w", newline='', encoding='utf-8') as tsvfile:
        writer = csv.writer(tsvfile, delimiter='\t')
        writer.writerow(["city", "library", "latitude", "longitude"])  # Header

        for row in reader:
            city = row["City"]
            library = row["Library"]
            query = f"{library}, {city}"
            if not query in cache and "nknown" not in query:
                cache.add(query)
                print(query)
                continue
                try:
                    coords = get_coordinates(query, more_args={"isNameRequired": False})
                    writer.writerow([city, library, coords["latitude"], coords["longitude"]])
                    print(city, library, coords["latitude"], coords["longitude"])
                except:
                    print(city, library, "Not found")

