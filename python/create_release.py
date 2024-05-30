"""Create a new release of the website.

The URL of the new release will look like this: https://pverkind.github.io/IkhwanMss/vYYYY-MM-DD
The base URL (https://pverkind.github.io/IkhwanMss/) will always redirect to the latest release
"""

from datetime import datetime
import os
import re
import shutil
import sys
import markdown

working_dir = "work-in-progress"
redirect_template_fp  = "templates/redirect.html"
page_template_fp  = "templates/page_template.html"
base_url = "https://pverkind.github.io/IkhwanMss/"

# get or create the name of the new release:
try:
    # check if the release folder was given as a command line argument:
    release_folder = sys.argv[1]
    print("RELEASE NAME (from CL argument):", release_folder)
except:
    # create the name for the release folder:
    timestamp = datetime.now().strftime("%Y-%m-%d")
    release_folder = "v" + timestamp
    print("RELEASE NAME (generated in Python):", release_folder)

release_url = base_url + release_folder
release_link = f'<a href="{release_url}">{release_folder}</a>'

# add the new release to the release notes: 

# get the current version of the release notes:
revision_fp = "./md/release-notes.md"
with open(revision_fp, mode="r", encoding="utf-8") as file:
    revision_text = file.read()

# make the new release version the current version:
revision_text = re.sub(r"The release you're looking at is.+", 
                       f"The release you're looking at is **[{release_folder}]({release_url})**",
                       revision_text)

# add the new release version to the release list (if it has not yet been manually added):
insert_note = "<!-- INSERT NEWER VERSION BELOW THIS -->"
if not re.findall(f"{insert_note}\s*\* \[{release_folder}", revision_text):
    revision_text = re.sub(insert_note, 
                           f"{insert_note}\n* [{release_folder}]({release_url})",
                           revision_text)

# store the current release notes as a markdown file:
with open(revision_fp, mode="w", encoding="utf-8") as file:
    file.write(revision_text)

# create the release notes html file:
with open(page_template_fp, mode="r", encoding="utf-8") as file:
    template_str = file.read()
wip_revision_fp = "work-in-progress/release-notes.html"
with open(wip_revision_fp, mode="w", encoding="utf-8") as file:
    html = markdown.markdown(revision_text)
    html = template_str.replace("PAGE_CONTENT_HERE", html)
    file.write(html)

# Add a reference to the new release in all previous release notes + work-in-progress html file:
# for folder in sorted(os.listdir(".")):
#     if re.findall("^v\d+", folder):
#         earlier_revision_fp = os.path.join(folder, "release-notes.html")
#         shutil.copy(wip_revision_fp, earlier_revision_fp)

# for folder in sorted(os.listdir(".")):
#     if re.findall("^v\d+", folder) or folder.startswith("work-in"):
#         earlier_revision_fp = os.path.join(folder, "revision-and-update-notes.html")
#         if not os.path.exists(earlier_revision_fp):
#             continue
#         with open(earlier_revision_fp, mode="r", encoding="utf-8") as file: 
#             html = file.read()
#         if release_link in html:
#             continue
#         html = re.sub(f'{insert_note}\s*<ul>',
#                       f'{insert_note}\n<ul>\n<li>{release_link}</li>',
#                       html)
#         if folder == "work-in-progress":
#             html = re.sub(r'The current release is\s*<strong>[\s\S]+?</strong>',
#                           f'The current release is <strong>{release_link}</strong>',
#                           html)
#         with open(earlier_revision_fp, mode="w", encoding="utf-8") as file:
#             file.write(html)


# copy the current working directory to the release folder:
if os.path.exists(release_folder):
    shutil.rmtree(release_folder)
shutil.copytree(working_dir, release_folder)

# reroute the user to the new release:
with open(redirect_template_fp, mode="r", encoding="utf-8") as file:
    html = file.read()
html = html.replace("LATEST_VERSION_URL", release_url)
with open("index.html", mode="w", encoding="utf-8") as file:
    file.write(html)

# change the reference to the GitHub data folder in the release index.html file:
index_fp = os.path.join(release_folder, "index.html")
with open(index_fp, mode="r", encoding="utf-8") as file:
    html = file.read()
with open(index_fp, mode="w", encoding="utf-8") as file:
    file.write(html.replace("work-in-progress/data", release_folder+"/data"))

# print the name of the new folder so that it can be used by the workflow script:
print(f'::set-output name=release_folder::{release_folder}')