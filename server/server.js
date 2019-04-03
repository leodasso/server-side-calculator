const express = require('express');
const bodyParser = require('body-parser');
let PORT = process.env.PORT || 5000;
let calculations = [];
const app = express();

let currentOperation = [];

app.listen(PORT, () => {
    console.log('NodeJS server running on port ' + PORT);
});

app.use(express.static('server/public'));

// make sure this line is above anywhere where we're parsing req.body
app.use(bodyParser.urlencoded({extended: true}));

// Route for sending array of calculation history to the client
app.get('/calculation', (req, res) => {

    res.send(calculations);
})

// Route for recieving calculation objects from the client
app.post('/calculation', (req, res) => {

    currentOperation = req.body.ops;

    let answer = parseOperation();    

    // create a new calculation object which contains the result.
    // we store this in an array here on the server
    let newCalc = {
        operation: req.body.readable,
        result: answer
    }
    calculations.push(newCalc);

    res.sendStatus(201);
});

// parse the calc operator. Maybe there's a better way to do this
// but idk, this get's the job done.
function parseOperation() {

    // set a max for the amount of parsing iterations we can do
    let parseIterations = 0;
    let maxIterations = 50;

    if (isAnOperator(currentOperation[0]) || 
        isAnOperator(currentOperation[currentOperation.length - 1])) {
            return 'error';
        }

    // order of operations: start with *, /
    // do passes until theres no operators remaining
    while( currentOperationInProgress('*/')) {

        doOneParse('*/');
        parseIterations++;
        if (parseIterations >= maxIterations) {
            break;
        }
    }

    // add / subtract 
    while( currentOperationInProgress('+-')) {

        doOneParse('+-');
        parseIterations++;
        if (parseIterations >= maxIterations) {
            break;
        }
    }

    return currentOperation;
}


function doOneParse(allowedOperators) {

    for (let i = 0; i < currentOperation.length; i++) {

        const symbol = currentOperation[i];

        // ignore numbers or operators that aren't allowed
        if (!isAnOperator(symbol) || !allowedOperators.includes(symbol)) {
            continue;
        }

        // an operator can't be at beginning or end
        if (i <= 0 || i >= currentOperation.length - 1) {
            console.log('error: symbol ' + symbol + ' cant be at edge');
            return 'error';
        }

        // if we've gotten here, it's probably reasonable to assume that
        // the symbol is a valid operator between 2 numbers
        let prev = currentOperation[i - 1];
        let next = currentOperation[i + 1];

        let result = executeOperator(Number(prev), Number(next), symbol);
        currentOperation[i] = result;

        // remove the element before & after this, and replace this element with the result
        currentOperation.splice(i-1, 3, result);

        // since we've modified the length of the array, return here.
        // the parser function higher in the stack will continue to do
        // passes of this function until the array has only 1 element (i.e. the answer)
        return;
    }
}

// returns number result
function executeOperator(num1, num2, operatorString) {

    switch (operatorString) {
        case '*': return num1 * num2;
        case '/': return num1 / num2;
        case '+': return num1 + num2;
        case '-': return num1 - num2;
        default: return 'error';
    }
}

// RETURNS BOOL
function isAnOperator(inputString) {

    return inputString == '+' || inputString == '-' ||
    inputString == '*' || inputString == "/";
}

// as long as the current operation has the given operators (+, -, *, etc), 
// it will still be considered in progress
function currentOperationInProgress(operatorsString) {

    for (element of currentOperation) {
        if (operatorsString.includes(element)) {
            return true;
        }
    }
    return false;
}