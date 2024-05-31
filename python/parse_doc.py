"""Parse the document containing the detailed descriptions
of the manuscripts and store the data as a json file."""


#! pip install python-docx
from docx import Document
import json
import csv
import re
import urllib.parse
import textwrap

def normalize_call_no(s):
    return re.sub("[^a-zA-Z0-9۰-۹?]+", "", s)

def clean_paragraph(p):
    # remove double spaces:
    p = re.sub("  +", " ", p)
    # decode URLs that contain Arabic script:
    if "%D8" in p or "%B" in p:
        p = urllib.parse.unquote(p)
    # break long URLs:
    long_words = [w for w in re.findall("[^ ]+", p) if len(w) > 60]
    for w in long_words:
        w = w.strip("().")
        broken_w = "<br>".join(textwrap.wrap(p, 60, break_on_hyphens=False))
        p = re.sub(w, broken_w, p)
    # add links:
    p = re.sub('(?<!")(http[^ ]+)', r'<a href="\1" target="_blank">\1</a>', p)
    # remove line breaks in links:
    while re.findall('href="[^"]+<br/?>', p):
        p = re.sub('(href="[^"]+)<br/?>', r'\1', p)

    return p
    

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
            lib = paragraph.text.strip().replace("’", "'")
            d[city][lib] = dict()
        elif paragraph.style.name.startswith('Heading 3'):
            #call_nos.append(paragraph.text)
            call_nos.append(lib + " " + paragraph.text)
            call_no = normalize_call_no(paragraph.text)
            d[city][lib][call_no] = ""
        else:
            text = clean_paragraph(paragraph.text.strip())
            if text:
                try:
                    d[city][lib][call_no] += '<p dir="auto">' + text + '</p>'
                except:
                    print("Error converting paragraph no.", i)
                    print("city, library, call number:", [city, lib, call_no])
                    print("paragraph text:", [paragraph.text])
                    print("----")
    with open(json_fp, mode="w", encoding="utf-8") as file:
        json.dump(d, file, indent=2, ensure_ascii=False)

    # check if there are manuscripts in the tsv file that are not in the json:
    normalized_call_nos = {normalize_call_no(call_no): call_no for call_no in call_nos}
    with open(sheet_fp, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter="\t")
        print("call numbers not found in the word document:")
        for row in reader:
            call_no = normalize_call_no(str(row["Library"])+ " " + str(row["(Collection + ) Call Number"]))
            if call_no not in normalized_call_nos:
                print("*", [row["City"], row["Library"], row["(Collection + ) Call Number"].strip()])
            else:
                #call_nos = [el for el in call_nos if el != call_no]
                del normalized_call_nos[call_no]
        print("----")
        print("call numbers not found in the spreadsheet:")
        for call_no in normalized_call_nos:
            print("*", normalized_call_nos[call_no])


doc_fp = "./work-in-progress/data/msDescriptions.docx"
sheet_fp = "./work-in-progress/data/msData.tsv"
json_fp = "./work-in-progress/data/msDescriptions.json"
parse_doc(doc_fp, sheet_fp, json_fp)
