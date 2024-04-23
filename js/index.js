function preprocessData(data){
    return data
}

// hidden child rows, see https://datatables.net/examples/api/row_details.html
function format(rowData) {
    // `rowData` is the original data object for the row
    let hiddenRowHtml = '<dl>';
    for (k in rowData){
        if (rowData[k]){
            hiddenRowHtml += `
            <dt><b>${k}:</b></dt>
            <dd>${rowData[k]}</dd>
            `;
        }
    }
    hiddenRowHtml += '</dl>';
    return hiddenRowHtml;
}

let table;

let tsvPath = "data/IkhwanSafaMSSOverview - Blad1.tsv";
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