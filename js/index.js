function preprocessData(data){
    return data
}

function normalizeCallNo(s){
    return s.replace(/[^a-zA-Z0-9]+/g, "");
}

function cleanData(s) {
    // add link to URLs:
    s = s.replace(/(http[^ ]+)/g, '<a href="$1">$1</a>');
    // remove line breaks from links: 
    s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
    s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
    s = s.replace(/(href="[^"]+)<br\/?>/g, '$1');
    s = decodeURIComponent(s);
    return s
}

// hidden child rows, see https://datatables.net/examples/api/row_details.html
function format(rowData) {
    // `rowData` is the original data object for the row
    
    
    // get the description from the descriptions dictionary:
    let city = rowData["City"].trim();
    let lib = String(rowData["Library"]).trim();
    let callNo = normalizeCallNo(String(rowData["(Collection + ) Call Number"]));
    console.log("city:" + city);
    console.log("lib:" + lib);
    console.log("callNo:" + callNo);
    let descr = descriptions[city][lib][callNo];
    

    /*let hiddenRowHtml = '<div class="columns" dir="auto">';
    for (k in rowData){
        if (rowData[k]){
            hiddenRowHtml += `
            <div class="entry">
              <p><strong>${k}:</strong></p>
              <p>${rowData[k]}</p>
            </div>
            `;
        }
    }
    hiddenRowHtml += `
            <div class="entry">
              <p><strong>Description:</strong></p>
              ${descr}
            </div>
            `;
    hiddenRowHtml += '</div>';*/
    let hiddenRowHtml = '<dl class="columns" dir="auto">';
    for (k in rowData){
        if (rowData[k]){
            hiddenRowHtml += `
            <dt><b>${k}:</b></dt>
            <dd>${cleanData(rowData[k])}</dd>
            `;
        }
    }
    hiddenRowHtml += `
            <dt><b>Description:</b></dt>
            <dd>${descr}</dd>
            `;
    hiddenRowHtml += '</dl>';

    
    /*hiddenRowHtml = `
    <table class="hidden-table">
      <tr>
        <td class="details-col">
          ${hiddenRowHtml}
        </td>
        <td class="descr-col">
          <b>Description</b>: <br/>
          ${descr}
        </td>
      </tr>
    </table>
    `*/
    return hiddenRowHtml;
}

let table;
let descriptions;

let jsonPath = "data/msDescriptions.json";
$.get(jsonPath, function(contents) {
    descriptions = contents;
});


//let tsvPath = "data/IkhwanSafaMSSOverview - Blad1.tsv";
let tsvPath = "data/msData.tsv"
$.get(tsvPath, function(contents) {
    // pass contents of file to Papa.parse to parse the tsv into a list of dictionaries:
    Papa.parse(contents,  {
        header: true,         // each row will become a dictionary
        delimiter: '\t',
        dynamicTyping: true,  // interpret numbers as integers, strings as strings etc.
        quoteChar: false,     // consider quote characters " and ' as literal quotes
        skipEmptyLines: true,
        complete: function(results) {
            console.log(results);
            // after file is loaded, pass the data to the datatable:
            let data = preprocessData(results.data)
            table = $('#msTable').DataTable( {
                data: data,
                pageLength: 25,  // number of rows displayed by default
                columns: [  // define the columns that should be displayed
                    {
                        // first column: icon for showing collapsed detailed data
                        className: 'dt-control',
                        orderable: false,
                        data: null,
                        defaultContent: ''
                    },
                    { 
                        data: 'City',   // use this column in the TSV data
                        title: 'City'   // use this as the header for the datatable column
                    },
                    { 
                        data: 'Library',   // use this column in the TSV data
                        title: 'Library'   // use this as the header for the datatable column
                    },
                    { 
                        data: '(Collection + ) Call Number', 
                        title: 'Call number' 
                    },
                    { 
                        data: 'Date AH', 
                        title: 'Date (AH)' 
                    },
                    { 
                        data: 'Date CE', 
                        title: 'Date (CE)'
                    }, 
                    { 
                        data: 'Witness to text', 
                        title: 'Text'
                    },
                    // add columns that should be searchable but not shown:
                    {
                        data: 'Specific contents',
                        visible: false
                    },
                ]
            });
            // Add event listener for opening and closing details
            table.on('click', 'td.dt-control', function (e) {
                let tr = e.target.closest('tr');
                let row = table.row(tr);
            
                if (row.child.isShown()) {
                    // This row is already open - close it
                    row.child.hide();
                }
                else {
                    // Open this row
                    row.child(format(row.data())).show();
                }
            });
        }
    });
});
