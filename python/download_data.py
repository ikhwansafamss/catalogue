"""
Download the spreadsheet and description document

NB: downloading the description document currently doesn't work!
"""

import requests
import re
import time

doc_url = "https://docs.google.com/document/d/1hZuWEOd0tFTWL7yGuKAfQODVpSWjgf3rcvsQi5D7AC8/edit?usp=sharing"
sheet_url = "https://docs.google.com/spreadsheets/d/1jBbUb7qObE02WkVdkerRty0MIBRWsBh4SzTK725k7bM/edit#gid=0"


def extract_id_from_url(url):
    "https://drive.google.com/file/d/10jmLUriVDjViO9rR20rByb4REkwwYNJZ/view?usp=sharing"
    "https://drive.google.com/drive/folders/1c3CCd1th2cM1N6xGDrOKClFc5yOCRlk5"
    "https://docs.google.com/document/d/1hZuWEOd0tFTWL7yGuKAfQODVpSWjgf3rcvsQi5D7AC8/edit?usp=sharing"
    "https://docs.google.com/spreadsheets/d/1jBbUb7qObE02WkVdkerRty0MIBRWsBh4SzTK725k7bM/edit#gid=0"
    
    #return url.split("/")[5]
    ids = re.findall("/d/([^/]+)", url)
    if ids:
        return ids[0]
    else:
        ids = re.findall("/d/([^/]+)", url)
        if ids:
            return ids[0]
    

def download_file_from_gdrive(url, fp):
    """https://stackoverflow.com/a/39225272"""
    print("download file from google drive:", url)
    file_id = extract_id_from_url(url)
    print(file_id)
    gurl = "https://docs.google.com/uc?export=download&confirm=1"
    session = requests.Session()
    response = session.get(gurl, params={"id": file_id, "confirm": 1}, stream=True)
    with open(fp, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)


def download_file_from_gdrive(url, fp):
    """https://stackoverflow.com/a/39225039/4045481"""
    def get_confirm_token(response):
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                return value
        return None

    def save_response_content(response, destination):
        CHUNK_SIZE = 32768

        with open(destination, "wb") as f:
            for chunk in response.iter_content(CHUNK_SIZE):
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)

    print("download file from google drive:", url)
    file_id = extract_id_from_url(url)
    print(file_id)
    
    gurl = "https://docs.google.com/uc?export=download"
    session = requests.Session()
    response = session.get(gurl, params={"id": file_id}, stream=True)
    token = get_confirm_token(response)
    print(response)
    print(token)

    if token:
        params = { "id" : file_id, 'confirm' : token }
        response = session.get(gurl, params = params, stream = True)

    save_response_content(response, fp)    


def download_spreadsheet(url, fp, sheet_no=0, format="tsv"):
    file_id = extract_id_from_url(url)
    gurl = f"https://docs.google.com/spreadsheets/d/{file_id}/export?gid={sheet_no}&format={format}"
    session = requests.Session()
    response = session.get(gurl, params={"id": file_id, "gid": sheet_no}, stream=True)
    with open(fp, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)

    

def main():
    sheet_fp = "../data/msData.tsv"
    doc_fp = "../data/msDescriptions.docx"
    # NB: the word document doesn't download!
    #download_file_from_gdrive(doc_url, doc_fp)
    download_spreadsheet(sheet_url, sheet_fp)
    print("sleep 5 seconds before updating website data")
    time.sleep(5)

main()

