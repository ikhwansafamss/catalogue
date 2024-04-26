"""Parse the document containing the detailed descriptions
of the manuscripts and store the data as a json file."""


#! pip install python-docx
from docx import Document
import json
import csv
import re

def normalize_call_no(s):
    return re.sub("[^a-zA-Z0-9]+", "", s)
    

def parse_doc(doc_fp, sheet_fp, json_fp):
    
    d = dict()
    call_nos = []
    document = Document(doc_fp)
    for i, paragraph in enumerate(document.paragraphs):
        #print(i, [paragraph.text[:50]], paragraph.style.name)
        if paragraph.style.name.startswith('Heading 1'):
            city = paragraph.text.strip()
            d[city] = dict()
            lib = None
            call_no = None
        elif paragraph.style.name.startswith('Heading 2'):
            lib = paragraph.text.strip()
            d[city][lib] = dict()
        elif paragraph.style.name.startswith('Heading 3'):
            call_nos.append(paragraph.text)
            call_no = normalize_call_no(paragraph.text)
            d[city][lib][call_no] = ""
            
        else:
            if paragraph.text.strip():
                try:
                    d[city][lib][call_no] += '<p dir="auto">' + paragraph.text.strip() + '</p>'
                except:
                    print("Error in paragraph no.", i)
                    print([city, lib, call_no])
                    print([paragraph.text])
                    print("----")
    with open(json_fp, mode="w", encoding="utf-8") as file:
        json.dump(d, file, indent=2, ensure_ascii=False)

    # check if there are manuscripts in the tsv file that are not in the json:
    normalized_call_nos = {normalize_call_no(call_no): call_no for call_no in call_nos}
    with open(sheet_fp, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter="\t")
        print("call numbers not found in the word document:")
        for row in reader:
            call_no = normalize_call_no(str(row["(Collection + ) Call Number"]))
            if call_no not in normalized_call_nos:
                print("*", [row["City"], row["Library"], row["(Collection + ) Call Number"].strip()])
            else:
                #call_nos = [el for el in call_nos if el != call_no]
                del normalized_call_nos[call_no]
        print("----")
        print("call numbers not found in the spreadsheet:")
        for call_no in normalized_call_nos:
            print("*", normalized_call_nos[call_no])


if __name__ == "__main__":
    doc_fp = "../data/msDescriptions.docx"
    sheet_fp = "../data/msData.tsv"
    json_fp = "../data/msDescriptions.json"
    parse_doc(doc_fp, sheet_fp, json_fp)
