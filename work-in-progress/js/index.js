/********************
 * HELPER FUNCTIONS *
 ********************/

function preprocessData(data){
    let formattedData = data.map((item) => {
        let link = item["Digital resource"];
        if (link) {
            link = decodeURI(link);
            link = link.replace(/(http[^ ]+)/, '<a href="$1" target="_blank">$1</a>');
        }
        item["Digital resource"] = link;

        link = item["Catalogue reference"];
        if (link) {
            link = decodeURI(link);
            link = link.replace(/(http[^ ]+)/, '<a href="$1" target="_blank">$1</a>');
        }
        item["Catalogue reference"] = link;

        return item
    });
    return formattedData;
}

function regexEscape(s){ 
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

function normalizeCallNo(s){
    return s.replace(/[^a-zA-Z0-9۰-۹?]+/g, "");
}

function cleanData(s) {
    if (typeof s === 'string' || s instanceof String) {
        // add link to URLs:
        s = s.replace(/([^">])(http[^ ]+)/g, '$1<a href="$2" target="_blank">$2</a>');
        // remove line breaks from links: 
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
        // decode url-encoded strings:
        s = decodeURIComponent(s);
    }
    return s
}

// hidden child rows, see https://datatables.net/examples/api/row_details.html
function format(rowData) {
    // `rowData` is the original data object for the row
    
    
    // get the description from the descriptions dictionary:
    let city = rowData["City"].trim();
    let lib = String(rowData["Library"]).trim().replace(/’/g, "'");
    let callNo = normalizeCallNo(String(rowData["(Collection + ) Call Number"]));
    console.log("city:" + city);
    console.log("lib:" + lib);
    console.log("callNo:" + callNo);
    let descr = descriptions[city][lib][callNo];
    

    /*let hiddenRowHtml = '<dl class="columns" dir="auto">';*/
    let hiddenRowHtml = '<dl dir="auto">';
    for (k in rowData){
        if (rowData[k]){
            hiddenRowHtml += `
            <dt><strong>${k}:</strong></dt>
            <dd>${cleanData(rowData[k])}</dd>
            `;
        }
    }
    /*hiddenRowHtml += `
            <dt><strong>Description:</strong></dt>
            <dd>${descr}</dd>
            `;*/
    hiddenRowHtml += '</dl>';
    hiddenRowHtml = `
        <div class="details">
          <div class="column" class="left-col">
            ${hiddenRowHtml}
          </div>
          <div class="column" class="right-col">
            <dl dir="auto">
              <dt><strong>Description:</strong></dt>
              <dd>${descr}</dd>
            </dl>
          </div>
        </div>`


    return hiddenRowHtml;
}


/**********************************
 * Show/hide about div
 **********************************/
const titleColophon = document.getElementById("titleColophon");
const aboutDiv = document.getElementById("aboutDiv");
titleColophon.addEventListener("click", function(e) {
    if (aboutDiv.style.display == "none") {
        aboutDiv.style.display = "block";
      } else {
        aboutDiv.style.display = "none";
      }
});


/***************
 * BUILD TABLE *
 ***************/

let table;
let descriptions;
let toggleStr = "Toggle columns: ";
const initiallyVisible = [
    "City", 
    "Library", 
    "(Collection + ) Call Number", 
    "Witness to text",
    "Date AH",
    "Date CE",
];

let jsonPath = "data/msDescriptions.json";
$.get(jsonPath, function(contents) {
    descriptions = contents;

    // set display names for the tsv columns:
    let columnAliases = {
        "(Collection + ) Call Number": "Call Number",
        "Witness to text": "Text"
    };
    //let tsvPath = "data/IkhwanSafaMSSOverview - Blad1.tsv";
    let tsvPath = "data/msData.tsv"
    $.get(tsvPath, function(contents) {
        // pass contents of file to Papa.parse to parse the tsv into a list of dictionaries:
        Papa.parse(contents,  {
        
            header: true,         // each row will become a dictionary
            delimiter: '\t',
            dynamicTyping: false,  // interpret numbers as integers, strings as strings etc.
            quoteChar: false,     // consider quote characters " and ' as literal quotes
            skipEmptyLines: true,
            complete: function(results) {
                // after the tsv file is loaded, extract the column headers
                // and create the column toggle:

                console.log(results.data);
                //console.log(results.errors);

                let columns = [
                    {
                        // first column: icon for showing collapsed detailed data
                        className: 'dt-control',
                        orderable: false,
                        data: null,
                        defaultContent: ''
                    },
                ]
                let i = 0;
                for (key in results.data[0]){
                    if (key){
                        i += 1;
                        let visible = initiallyVisible.includes(key) ? "" : "invisible-col";
                        let classStr = `toggle-vis ${visible}`.trim();
                        toggleStr += `<a class="${classStr}" data-column="${i}">${columnAliases[key] || key}</a><span class="single-triangle"></span>`;
                        columns.push({
                            data: key,
                            title: columnAliases[key] || key,
                            visible: initiallyVisible.includes(key),
                            orderable: ["(Collection + ) Call Number", "Call Number", "Library"].includes(key) ? false: true,
                            type: "natural-ci",  // adapted version of https://datatables.net/plug-ins/sorting/natural
                            render: function (data, type, row, meta) {
                                return '<div class="tablecell-content">' + data + '</div>';
                            }
                        });
                    };
                }
                // add a column with the description, to make the description searchable:
                let descrCol = {
                    render: (data, type, row) => {
                        let city = row["City"].trim();
                        let lib = String(row["Library"]).trim().replace(/’/g, "'");
                        let callNo = normalizeCallNo(String(row["(Collection + ) Call Number"]));
                        try {
                          return descriptions[city][lib][callNo];
                        } catch(err) {
                            console.log(err);
                            console.log("lib: "+lib);
                            console.log("city: "+city);
                            console.log("callNo: "+callNo);
                            return "";
                        }
                    },
                    visible: false, 
                    title: "Description"
                };
                columns.push(descrCol);
                toggleStr += `<a class="toggle-vis invisible-col" data-column="${i+1}">Description</a><span class="single-triangle"></span>`;
                // Then, pass the data to the datatable:
                let data = preprocessData(results.data);
                table = $('#msTable').DataTable( {
                    data: data,
                    pageLength: 25,  // number of rows displayed by default
                    lengthMenu: [10, 25, 50, { label: 'All', value: -1 }],
                    columns: columns,
                    search: { regex: true, smart: true }
                });
                // Add event listener for opening and closing details: 
                table.on('click', 'td.dt-control', function (e) {
                    let tr = e.target.closest('tr');
                    let row = table.row(tr);
                
                    if (row.child.isShown()) {
                        row.child.hide();
                    }
                    else {
                        row.child(format(row.data())).show();
                    }
                });

                // Create the column toggle feature:
                $('#toggleDiv').html(toggleStr.replace(/<span class="single-triangle"><\/span>$/, ""));
                document.querySelectorAll('a.toggle-vis').forEach((el) => {
                    el.addEventListener('click', function (e) {
                        console.log("clicked");
                        e.preventDefault();
                
                        let columnIdx = e.target.getAttribute('data-column');
                        let column = table.column(columnIdx);

                        console.log("Clicked: column no. "+columnIdx);
                
                        // Toggle the visibility of the column in the table:
                        column.visible(!column.visible());

                        // Toggle the color of the column name in the toggle list:
                        el.classList.toggle("invisible-col");
                        
                    });
                });
            }
        });
    });
});

/**********************************
 * Reset table button
 **********************************/
$('#resetFilters').on('click', () => {
  table.search('');
  table.columns().search('');
  table.draw();
})


/**********************************
 * Map
 **********************************/

// Initialize the map
var map = L.map('map').setView([20, 50], 2); // Center the world here + zoom level
map.setMaxBounds(  [[-90,-180],   [90,180]]  ) // only one world!

/*// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);*/
// Add Stamen watercolor tiles
var Stadia_StamenWatercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
    minZoom: 1,
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
});
Stadia_StamenWatercolor.addTo(map);

// Create a marker cluster group (to combine )
var markers = L.markerClusterGroup();
// NB: marker icon (css/images/marker-icon.png) taken from the Piri Reis world map: https://upload.wikimedia.org/wikipedia/commons/7/70/Piri_reis_world_map_01.jpg

// Load CSV file
Papa.parse('data/library_coordinates.tsv', {
    download: true,
    header: true,
    delimiter: "\t",
    complete: function(results) {
        results.data.forEach(function(row) {
            if (row.latitude && row.longitude) {
                var marker = L.marker([parseFloat(row.latitude), parseFloat(row.longitude)]);
                let markerText = `
                  <b>${row.city}</b>
                  <br>
                  ${row.library}
                  <a href="#" class="place-filter" data-city="${encodeURIComponent(row.city)}" data-lib="${encodeURIComponent(row.library)}">
                    (filter)
                  </a>`;
                marker.bindPopup(markerText);
                /*marker.on('click', () => {
                    // Column-specific exact-match filter on the "Place" column (index 1)
                    //table.column(1).search(exact, true, false).draw();
                    table.search(row.library).draw();
                });*/
                markers.addLayer(marker);
            }
        });
        map.addLayer(markers);
    }
});

// EVENT DELEGATION: one handler for all current/future popups.
// This only fires when the user clicks the link in the popup.
map.getPanes().popupPane.addEventListener('click', (e) => {
    const a = e.target.closest('a.place-filter');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation(); // don't treat it as a marker/map click

    const lib = decodeURIComponent(a.dataset.lib);
    const city = decodeURIComponent(a.dataset.city);

    // Column-specific filter:
    table.column(1).search(city.replace(/[^a-zA-Z ]/g, "."), true, false).draw(); // regex, not smart search
    table.column(2).search(lib.replace(/[^a-zA-Z ]/g, "."), true, false).draw(); // regex, not smart search
    table.draw();
    // alternatively: table-wide filter:
    //table.search(regexEscape(lib)).draw();
});
