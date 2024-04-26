"""Parse the document containing the detailed descriptions
of the manuscripts and store the data as a json file."""


#! pip install python-docx
from docx import Document
import json

def parse_doc(doc_fp, json_fp):
    
    d = dict()
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
            call_no = paragraph.text.strip()
            d[city][lib][call_no] = ""
        else:
            if paragraph.text.strip():
                try:
                    d[city][lib][call_no] += "<p>" + paragraph.text.strip() + "</p>"
                except:
                    print("Error in paragraph no.", i)
                    print([city, lib, call_no])
                    print([paragraph.text])
                    print("----")
    with open(json_fp, mode="w", encoding="utf-8") as file:
        json.dump(d, file, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    doc_fp = "../data/msDescriptions.docx"
    json_fp = "../data/msDescriptions.json"
    parse_doc(doc_fp, json_fp)
