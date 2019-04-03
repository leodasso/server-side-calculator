// this is an array of strings that will store the full operation
// input from the client. it will be sent over to server, which
// has the fun job of parsing it.
let operation = [];

$(document).ready(docReady);
function docReady() {

    // refresh the history list
    refreshHistory();

    // add listeners for buttons
    $('#clear').on('click', clear);
    $('.calcButton').on('click', handleButton);
    $(document).keydown(onKeyPress);
}

function onKeyPress(keyPressInfo) {

    if (keyPressInfo.key == 'Enter' || keyPressInfo.key == '=') {
        $('#equal').click();
        return;
    }

    if (keyPressInfo.key == '-') {
        $('#minus').click();
        return;
    }

    if (keyPressInfo.key == '+') {
        $('#plus').click();
        return;
    }

    if (keyPressInfo.key == '*') {
        $('#times').click();
        return;
    }

    if (keyPressInfo.key == '/') {
        $('#divide').click();
        return;
    }

    $('#' + keyPressInfo.key).click();
}

function clear() {
    
    operation = [];
    $('#print').text('0');
}


// Sends the parameters of the calculation to the server
function sendCalcInfo() {

    let package = { ops: operation, readable: readableOperation()};

    // send the calculation request to the server
    $.ajax( {url: "/calculation", type: "POST", data: package}).then(refreshHistory);
    clear();
}

function refreshHistory() {

    $.ajax( {url: "/calculation", type: "GET"}).then(
        function(response) {

            // find the most recent result
            if (response.length > 0) {
                let result = response[response.length-1].result;
                //$('#result').text(result);
                $('#print').text(result);
            }

            let history = $('#history');
            // clear the previous history html
            history.empty();

            // add new html for each calculation. Loop backwards
            // so the most recent calculations appear at the top
            for (let i = response.length - 1; i >= 0; i--) {
                const item = response[i];
                let itemHtml = 
                    `<div class="historyItem">${item.operation} = ${item.result}</div>`;
                history.append(itemHtml);
            }
        }
    )
}


function handleButton() {

    let buttonData = $(this).data();

    // if the equls key is pressed, we want to just send the operation 
    // over to the server and ignore the rest of what happens here.
    if (buttonData.num == '=') {
        sendCalcInfo();
        return;
    }

    if (operation.length > 0) {
        // if the previous input & this input are numbers, just append prevInput with
        // this input. That way our array is clean and easy to parse. It should look
        // something like: 453, +, 22, /, 4.2
        if (!prevInputIsOperator() && !isAnOperator(buttonData.num)) {

            let concat = '' + operation[operation.length - 1] + buttonData.num;
            operation[operation.length - 1] = concat;     
            updateCalcDisplay();
            return;
        }

        // dont allow for multiple operators to be placed in succession
        // 5 + + 2 = error
        // 2 + - * 3 = error
        // 5 + 2 - 1 = ok!
        if (prevInputIsOperator() && isAnOperator(buttonData.num)) {
            return;
        }
    }

    operation.push(buttonData.num);
    updateCalcDisplay();
}

function updateCalcDisplay() {

    $('#print').text(readableOperation());
}

// RETURNS BOOL
function prevInputIsOperator() {

    if (operation.length <= 0) return false;
    let prevInput = operation[operation.length - 1];
    return isAnOperator(prevInput);
}

// RETURNS BOOL
function isAnOperator(inputString) {

    return inputString == '+' || inputString == '-' ||
    inputString == '*' || inputString == "/";
}

// returns string
function readableOperation() {

    let finalString = '';
    for (symbol of operation) {
        finalString += symbol + ' ';
    }
    return finalString;
}