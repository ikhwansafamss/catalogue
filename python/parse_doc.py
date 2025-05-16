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
    """Remove all non-necessary characters from the call number (to make matching easier)"""
    return re.sub("[^a-zA-Z0-9۰-۹?]+", "", s)

def extract_text(p):
    """Extract and style a docx Paragraph object"""
    text = ""
    for el in p.iter_inner_content():
        # determine the type of the paragraph element:
        try:
            el.bold
            el_type = "run"
        except:
            try:
                el.url
                el_type = "hyperlink"
            except:
                print(el)
                el_type = "other"
        
        if el_type == "run" and el.bold:
            text += re.sub(r"(^\s*)(.+?)(\s*$)", r"\1<strong>\2</strong>\3", el.text)
        elif el_type == "run" and el.italic:
            text += re.sub(r"(^\s*)(.+?)(\s*$)", r'\1<span class="italics">\2</span>\3', el.text)
        elif el_type == "hyperlink" and el.url:
            #link_text = el.text
            # break long links (not necessary anymore):
            #if len(link_text) > 60:
            #    link_text = "<br>".join(textwrap.wrap(link_text, 72, break_on_hyphens=False))
            #link = f'<a href="{el.url}" target="_blank">{link_text}</a>'
            link = f'<a href="{el.url}" target="_blank">{el.text}</a>'
            # move spaces outside the <a> tag:
            if "> " in link:
                link = " " + link.replace("> ", ">")
            if " <" in link:
                link = link.replace(" <", "<") + " "
            # decode URLs that contain Arabic script:
            if "%D8" in link or "%B" in link:
                link = urllib.parse.unquote(link)
            text += link
        else:
            text += el.text

    return text.strip()

def clean_paragraph(p):
    """Clean a paragraph string"""
    # remove double spaces:
    p = re.sub("  +", " ", p)
    # remove bold/italic tags that surround every word separately:
    p = re.sub(r'</span>([^\w\n]+)<span class="italics">', r"\1", p)
    p = re.sub(r'</strong>([^\w\n]+)<strong>', r"\1", p)

    # # break long URLs:  # not necessary anymore
    # long_words = [w for w in re.findall("[^ ]+", p) if len(w) > 60]
    # for w in long_words:
    #     w = w.strip("().")
    #     broken_w = "<br>".join(textwrap.wrap(p, 60, break_on_hyphens=False))
    #     p = re.sub(w, broken_w, p)
    # # add links:
    # p = re.sub('(?<!")(http[^ ]+)', r'<a href="\1" target="_blank">\1</a>', p)
    # # remove line breaks in links:
    # while re.findall('href="[^"]+<br/?>', p):
    #     p = re.sub('(href="[^"]+)<br/?>', r'\1', p)

    return p
    

def parse_doc(doc_fp, sheet_fp, json_fp):
    """Parse a Word document. 
    
    Args:
        doc_fp (str): path to the input document
        sheet_fp (str): path to the spreadsheet (to check for missing call numbers)
        json_fp (str): path to the output json file
    """
    d = dict()
    call_nos = []
    document = Document(doc_fp)
    for i, paragraph in enumerate(document.paragraphs):
        if paragraph.style.name.startswith('Heading 1'):
            city = paragraph.text.strip()
            d[city] = dict()
            lib = None
            call_no = None
        elif paragraph.style.name.startswith('Heading 2'):
            lib = paragraph.text.strip().replace("’", "'")
            d[city][lib] = dict()
        elif paragraph.style.name.startswith('Heading 3'):
            call_nos.append(city + " " + lib + " " + paragraph.text)
            call_no = normalize_call_no(paragraph.text)
            d[city][lib][call_no] = ""
        else:
            text = extract_text(paragraph)
            text = clean_paragraph(text)
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

    # check if there are manuscripts in the tsv file that are not in the json and vice versa:
    normalized_call_nos = {normalize_call_no(call_no): call_no for call_no in call_nos}
    with open(sheet_fp, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter="\t")
        
        not_found = []
        for i, row in enumerate(reader):
            try:
                print(row["City"], row["(Collection + ) Call Number"] )
                call_no = normalize_call_no(str(row["City"]).strip() + str(row["Library"]).strip().replace("’", "'")+ " " + str(row["(Collection + ) Call Number"]))
            except Exception as e:
                print("Error normalizing call no:", e)
                call_no = None
                continue
            if call_no not in normalized_call_nos:
                not_found.append(f'* {row["City"]} {row["Library"]} {row["(Collection + ) Call Number"]}'.strip())
            else:
                #call_nos = [el for el in call_nos if el != call_no]
                del normalized_call_nos[call_no]
        if not_found: 
            print("call numbers not found in the Word document:")
            for n in not_found:
                print(n)
        else: 
            print("All call numbers from the spreadsheet were found in the Word document.")

        print("----")

        if normalized_call_nos:
            print("call numbers not found in the spreadsheet:")
            for call_no in normalized_call_nos:
                print("*", normalized_call_nos[call_no])
        else:
            print("All call numbers from the Word document were found in the spreadsheet.")


doc_fp = "./work-in-progress/data/msDescriptions.docx"
sheet_fp = "./work-in-progress/data/msData.tsv"
json_fp = "./work-in-progress/data/msDescriptions.json"
parse_doc(doc_fp, sheet_fp, json_fp)
