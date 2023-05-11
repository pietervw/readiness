function submitForm() {

    // Get the input values
    var result = {
        rhr: document.getElementById("rhr").value,
        hrv: document.getElementById("hrv").value,
        sleepscore: document.getElementById("sleepscore").value,
        date: document.getElementById("datepicker").value,
        rhrMin: document.getElementById("rhrmin").value,
        rhrMax: document.getElementById("rhrmax").value,
        hrvMin: document.getElementById("hrvmin").value,
        hrvMax: document.getElementById("hrvmax").value
    };

    var validationPassed = validateForm(result.rhrMin, result.rhrMax, result.hrvMin, result.hrvMax, result.rhr, result.hrv, result.sleepscore);

    if (validationPassed && result.rhr, result.hrv, result.sleepscore) {
        result = calculateRecoveryScore(result);

        // Show recommendation
        determineWhichRecommendationToShow(result.recoveryscore);
    }

    // Set the output value
    document.getElementById("recoveryscore").value = result.recoveryscore ? result.recoveryscore + "%" : "N/A";

    // Add result to table and save to local storage
    addResultToLocalStorage(result);
    generateTableWithResults(result);
}

function validateForm(rhrMin, rhrMax, hrvMin, hrvMax, rhr, hrv, sleepscore) {

    if (rhrMin == "" || rhrMax == "" || hrvMin == "" || hrvMax == "") {
        alert("All fields must be filled out");
        return false;
    }
    else if (rhrMin > rhrMax || hrvMin > hrvMax) {
        alert("Min values must be less than max values");
        return false;
    }

    else {
        return true;
    }
}
function calculateRecoveryScore(result) {
    var rhrMin = result.rhrMin,
        rhrMax = result.rhrMax,
        hrvMin = result.hrvMin,
        hrvMax = result.hrvMax,
        rhr = result.rhr,
        hrv = result.hrv,
        sleepscore = result.sleepscore,
        date = result.date;

    if (!rhr || !hrv || !sleepscore)
        return result;

    // Get the previous values from local storage array
    var results = initLocalStorageResults();

    //TODO: remove any existing result for the same date
    results = results.filter(x => x.date != date);

    // only use results from the past 21 days
    results = results.filter(x => x.date > new Date(new Date().setDate(new Date(date).getDate() - 22)).toISOString().slice(0, 10)
        && x.date < new Date(new Date().setDate(new Date(date).getDate() + 1)).toISOString().slice(0, 10));

    // Get the min and max values for RHR and HRV
    var rhrs = [rhrMin, rhrMax, rhr];
    var hrvs = [hrvMin, hrvMax, hrv];
    // and push the values from local storage into array
    rhrs.push(...results.map(x => x.rhr));
    hrvs.push(...results.map(x => x.hrv));

    var calculatedRhrMin = Math.min(...rhrs);
    var calculatedRhrMax = Math.max(...rhrs);
    var calculatedHrvMin = Math.min(...hrvs);
    var calculatedHrvMax = Math.max(...hrvs);

    // Normalize the RHR and HRV data
    var normalizedRHR = 1 - ((rhr - calculatedRhrMin) / (calculatedRhrMax - calculatedRhrMin));
    var normalizedHRV = (hrv - calculatedHrvMin) / (calculatedHrvMax - calculatedHrvMin);

    // Weight the data
    var weightedRHR = normalizedRHR * 0.4;
    var weightedHRV = normalizedHRV * 0.4;
    var weightedSleepScore = sleepscore * 0.002;

    // Calculate the recovery score
    result.recoveryscore = ((weightedRHR + weightedHRV + weightedSleepScore) * 100).toFixed(0);
    return result;
}

function determineWhichRecommendationToShow(recoveryScore) {
    // Hide all recommendations class
    $(".recommendations").hide();

    // case recoveryScore is between 0 and 15
    if (recoveryScore >= 0 && recoveryScore <= 15)
        $("#recovery-0-15").show();
    else if (recoveryScore > 15 && recoveryScore <= 30)
        $("#recovery-15-30").show();
    else if (recoveryScore > 30 && recoveryScore <= 45)
        $("#recovery-30-45").show();
    else if (recoveryScore > 45 && recoveryScore <= 60)
        $("#recovery-45-60").show();
    else if (recoveryScore > 60 && recoveryScore <= 75)
        $("#recovery-60-75").show();
    else if (recoveryScore > 75 && recoveryScore <= 90)
        $("#recovery-75-90").show();
    else if (recoveryScore > 90 && recoveryScore <= 100)
        $("#recovery-90-100").show();
}

function updateLocalStorage() {

    // Get the input values using jquery
    var rhrMin = document.getElementById("rhrmin").value;
    var rhrMax = document.getElementById("rhrmax").value;
    var hrvMin = document.getElementById("hrvmin").value;
    var hrvMax = document.getElementById("hrvmax").value;

    // Store the values in local storage
    localStorage.setItem("rhrMin", rhrMin);
    localStorage.setItem("rhrMax", rhrMax);
    localStorage.setItem("hrvMin", hrvMin);
    localStorage.setItem("hrvMax", hrvMax);
}


function initLocalStorageResults() {

    // Initialize array
    var results = JSON.parse(localStorage.getItem("results"));
    if (results == null) {
        results = [];
    }
    return results;
}

function addResultToLocalStorage(result) {
    results = initLocalStorageResults();

    // Avoid duplicate results for the same day
    if (results != null) {
        for (var i = 0; i < results.length; i++) {
            if (results[i].date == result.date) {
                // Remove the old result
                results.splice(i, 1);
                break;
            }
        }
    }

    // save to local storage
    results.push(result);
    localStorage.setItem("results", JSON.stringify(results));
}

function generateTableWithResults() {
    // Clear the table rows
    var table = document.getElementById("resultsTable");
    var rowCount = table.rows.length;
    for (var i = 1; i < rowCount; i++) {
        table.deleteRow(1);
    }

    // Get the results from local storage
    var results = JSON.parse(localStorage.getItem("results"));
    if (results != null) {

        // sort results by date desc
        results.sort(function (a, b) {
            var dateA = new Date(a.date),
                dateB = new Date(b.date);
            return dateA - dateB;
        });
        for (var i = 0; i < results.length; i++) {
            addResultToTable(calculateRecoveryScore(results[i]));
        }
    }

    // highlight table
    highlightMinAndMaxTableCells();
}
function addResultToTable(result) {
    // Create the table row
    var table = document.getElementById("resultsTable");
    var row = table.insertRow(1);
    var dateCell = row.insertCell(0);
    var recoveryscoreCell = row.insertCell(1);
    var hrvCell = row.insertCell(2);
    var rhrCell = row.insertCell(3);
    var sleepscoreCell = row.insertCell(4);
    var actionsCell = row.insertCell(5);

    // convert date to yyyy/mm/dd DD format
    var date = new Date(result.date);
    var options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    dateCell.innerHTML = date.toLocaleDateString("en-US", options);
    // Add the data to the table row
    //dateCell.innerHTML = result.date ? result.date : "N/A";
    rhrCell.innerHTML = result.rhr ? result.rhr : "N/A";
    hrvCell.innerHTML = result.hrv ? result.hrv : "N/A";
    sleepscoreCell.innerHTML = result.sleepscore ? result.sleepscore + "%" : "N/A";
    recoveryscoreCell.innerHTML = result.recoveryscore ? result.recoveryscore + "%" : "N/A";
    actionsCell.innerHTML = '<a href="" title="delete" class="delete-btn" data-date="' + result.date + '"><i class="bi bi-trash" ></i></a>&nbsp;' +
        '<a href="" title="edit" class="edit-btn" data-date="' + result.date + '"><i class="bi bi-pencil" ></i></a>';
}

function deleteResult(date) {
    // Get the results from local storage
    var results = JSON.parse(localStorage.getItem("results"));
    if (results != null) {
        for (var i = 0; i < results.length; i++) {
            if (results[i].date == date) {
                // Remove the old result
                results.splice(i, 1);
                break;
            }
        }
    }

    // save to local storage
    localStorage.setItem("results", JSON.stringify(results));

    // Refresh the table
    generateTableWithResults();
}

function highlightMinAndMaxTableCells() {
    // highlight lowest and highest numbers in the table
    var table = document.getElementById("resultsTable");
    var rowCount = table.rows.length;
    var minRecoveryScore = 100;
    var maxRecoveryScore = 0;
    var minSleepScore = 100;
    var maxSleepScore = 0;
    var minRhr = 100;
    var maxRhr = 0;
    var minHrv = 100;
    var maxHrv = 0;

    for (var i = 1; i < rowCount; i++) {
        var row = table.rows[i];
        var recoveryScore = parseInt(row.cells[1].innerHTML);
        var sleepScore = parseInt(row.cells[4].innerHTML);
        var rhr = parseInt(row.cells[3].innerHTML);
        var hrv = parseInt(row.cells[2].innerHTML);

        if (recoveryScore < minRecoveryScore) {
            minRecoveryScore = recoveryScore;
        }
        if (recoveryScore > maxRecoveryScore) {
            maxRecoveryScore = recoveryScore;
        }
        if (sleepScore < minSleepScore) {
            minSleepScore = sleepScore;
        }
        if (sleepScore > maxSleepScore) {
            maxSleepScore = sleepScore;
        }
        if (rhr < minRhr) {
            minRhr = rhr;
        }
        if (rhr > maxRhr) {
            maxRhr = rhr;
        }
        if (hrv < minHrv) {
            minHrv = hrv;
        }
        if (hrv > maxHrv) {
            maxHrv = hrv;
        }
    }

    for (var i = 1; i < rowCount; i++) {
        var row = table.rows[i];
        var recoveryScore = parseInt(row.cells[1].innerHTML);
        var sleepScore = parseInt(row.cells[4].innerHTML);
        var rhr = parseInt(row.cells[3].innerHTML);
        var hrv = parseInt(row.cells[2].innerHTML);

        if (recoveryScore == minRecoveryScore) {
            row.cells[1].classList.add("text-danger");
        }
        if (recoveryScore == maxRecoveryScore) {
            row.cells[1].classList.add("text-success");
        }
        if (sleepScore == minSleepScore) {
            row.cells[4].classList.add("text-danger");
        }
        if (sleepScore == maxSleepScore) {
            row.cells[4].classList.add("text-success");
        }
        if (rhr == minRhr) {
            row.cells[3].classList.add("text-success");
        }
        if (rhr == maxRhr) {
            row.cells[3].classList.add("text-danger");
        }
        if (hrv == minHrv) {
            row.cells[2].classList.add("text-danger");
        }
        if (hrv == maxHrv) {
            row.cells[2].classList.add("text-success");
        }
    }

}

// function to load load local storage value for specified date into form
function loadValuesForSelectedDate() {
    // Get the results from local storage
    var results = JSON.parse(localStorage.getItem("results"));
    if (results != null) {
        for (var i = 0; i < results.length; i++) {
            if (results[i].date == document.getElementById("datepicker").value) {
                // Load the result into the form
                document.getElementById("rhr").value = results[i].rhr;
                document.getElementById("hrv").value = results[i].hrv;
                document.getElementById("sleepscore").value = results[i].sleepscore;
                document.getElementById("recoveryscore").value = results[i].recoveryscore;
                break;
            }
        }
    }

}

// jquery document ready
$(document).ready(function () {
    // Listen for changes to the input elements and update local storage using jquery
    $("#rhrmin").change(function () {
        updateLocalStorage();
    });
    $("#rhrmax").change(function () {
        updateLocalStorage();
    });
    $("#hrvmin").change(function () {
        updateLocalStorage();
    });
    $("#hrvmax").change(function () {
        updateLocalStorage();
    });
    $("#datepicker").change(function () {
        loadValuesForSelectedDate();
    });
    // Load local storage values on page load using jquery
    $("#rhrmin").val(localStorage.getItem("rhrMin"));
    $("#rhrmax").val(localStorage.getItem("rhrMax"));
    $("#hrvmin").val(localStorage.getItem("hrvMin"));
    $("#hrvmax").val(localStorage.getItem("hrvMax"));
    loadValuesForSelectedDate();


    // Get the current date in the format yyyy-mm-dd
    const today = new Date().toISOString().substr(0, 10);
    document.querySelector("#datepicker").value = today;

    // Set the max date for the date input to today
    document.querySelector("#datepicker").setAttribute("max", new Date());

 // generate table
    generateTableWithResults();

    // listen for delete button click
    $("#resultsTable").on("click", ".delete-btn", function (e) {
        e.preventDefault();
        var date = $(this).data("date");
        // Confirmation dialog box
        if (!confirm("Are you sure you want to delete this result?")) {
            return;
        }

        deleteResult(date);
    });

    // listen for edit button click
    $("#resultsTable").on("click", ".edit-btn", function (e) {
        e.preventDefault();
        var date = $(this).data("date");
        // Get the results from local storage
        var results = JSON.parse(localStorage.getItem("results"));
        if (results != null) {
            for (var i = 0; i < results.length; i++) {
                if (results[i].date == date) {
                    // Set the form values
                    $("#datepicker").val(results[i].date);
                    $("#rhr").val(results[i].rhr);
                    $("#hrv").val(results[i].hrv);
                    $("#sleepscore").val(results[i].sleepscore);
                    $("#recoveryscore").val(results[i].recoveryscore);
                    break;
                }
            }
        }
    });

    // On row click, highlight row
    $("#resultsTable").on("click", "tr", function (e) {
        e.preventDefault();
        // remove all other highlights
        $("tr").removeClass("highlight-row");
        $(this).toggleClass("highlight-row");

        // get this row's recovery score and remove "%" from the end
        var recoveryscore = $(this).find("td:nth-child(2)").text().slice(0, -1);
        determineWhichRecommendationToShow(recoveryscore);
    });

    // on click outside of table
    $(document).click(function (e) {
        // if the target of the click isn't the container nor a descendant of the container
        if (!$("#resultsTable").is(e.target) && $("#resultsTable").has(e.target).length === 0) {
            // remove all highlights
            $("tr").removeClass("highlight-row");

            // // if not calculate button being clicked
            // if (!$("#btn-calculate").is(e.target)) {
            //     // hide all recommendations
            //     $(".recommendations").hide();
            // }
        }
    });

    // on datepicker input click show the calendar
    // $("#datepicker").click(function (e) {
    //     e.preventDefault();
    //     $("#datepicker").datepicker("show");
    // });

    // make datepicker a bootstrap-datepicker
    // $("#datepicker").daterangepicker({
    //     singleDatePicker: true,
    //     showDropdowns: true,
    //     minYear: 2000,
    //     maxYear: parseInt(moment().format('YYYY'),10),
    //     maxDate: new Date()
    //   }, function(start, end, label) {
    //     // set input value to the selected date
    //     $("#datepicker").val(start.format('YYYY-MM-DD'));
    //   });

   
            


});

