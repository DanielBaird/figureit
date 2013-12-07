///////////////////////////////////////////////////////////////////////////////
// Copyright 2013 Daniel W Baird
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////////

// AMD compatibility copied from https://github.com/umdjs/umd/blob/master/amdWeb.js
(function (root, factory) {
    // maybe we're in an AMD context..
    if (typeof define === 'function' && define.amd) {
        define(factory); // ...if so, register as an AMD module
    } else {
        root.figureit = factory(); // ..if not, install as a browser global
    }
}(this, function() {

    var oldFigureit = window.figureit;

    // private funcs & vars =========================================

    // shim in a forEach implementation for sassafrassin' IE
    if (!Array.prototype.forEach) { Array.prototype.forEach = function (fn, scope) {
        'use strict'; var i, len; for (i = 0, len = this.length; i < len; ++i) { if (i in this) { fn.call(scope, this[i], i, this); } }
    }};

    // convenience functions coz I'm a lazy typist

    // shorter document.getElementById
    var elemId = function(id) { return document.getElementById(id); }

    //browser-independent way to attach events
    var attach = function(element, eventType, handler) {
        if (element.addEventListener) { element.addEventListener(eventType, handler, false) }
        else if (element.attachEvent) { element.attachEvent('on' + eventType, handler) };
    }

    // this function returns a function I'll use to log -------------
    var logFactory = function(whereToLogTo, level, additional) {
        // decide what levels to hide
        var levelsToHide = ['debug', 'info', 'warn'];
        if (levelsToHide.indexOf(level) != -1) {
            levelsToHide.length = levelsToHide.indexOf(level);
        }
        // return an appropriate logging function
        if (whereToLogTo === 'none' || (whereToLogTo === 'console' && (!window.console))) {
            // log to none: return a do-nothing function
            return (function() {})
        }
        if (whereToLogTo === 'console') {
            // log to console: return a log function that just console.logs
            return (function(message, severity) {
                severity = severity || 'info';
                if (levelsToHide.indexOf(severity) != -1) {
                    return
                }
                if (severity === 'warn') {
                    window.console.warn('[figureit warn ]', message);
                } else {
                    // pad severity to min 5 chars long (or longer if necessary)
                    var padded = (severity + "     ").substr(0, Math.max(severity.length, 5));
                    window.console.log('[figureit ' + padded + ']', message);
                }
            });
        }
        if (whereToLogTo === 'dom') {
            // log to dom: assume the additional arg is an id of a dom element to append to.
            var elem = document.createElement('pre');
            elemId(additional).appendChild(elem);

            return (function(message, severity) {
                severity = severity || 'info';
                if (levelsToHide.indexOf(severity) != -1) {
                    return
                }
                // pad severity to min 5 chars long (or longer if necessary)
                var padded = (severity + "     ").substr(0, Math.max(severity.length, 5));
                elem.innerHTML += '[' + padded + '] ' + message + "\n";
            });
        }
    }

    // functions for use in expressions -----------------------------
    var p2 = function(x) { return Math.pow(x,2); } // power of two
    var p3 = function(x) { return Math.pow(x,3); } // power of three
    var p4 = function(x) { return Math.pow(x,4); } // power of four
    var sq = p2; // squared => power of two
    var cu = p3; // cubed => power of three
    var pow = function(x,y) { return Math.pow(x,y); } // x to the power of y
    var round = function(x,places) { var tens = Math.pow(10,places); return (round(x * tens)/tens); }


    // default options ----------------------------------------------
    defaultOpts = {
        debug:    (document.URL.indexOf('debug') >= 0),  // true or false
        logTo:    'console',        // 'none', 'console', or an element id
        logLevel: 'info',           // 'debug', 'info', 'warn'
        form:     'figureitform',     // string id, or reference to HTML element
        output:   'figureitresult',   // string id, or reference to HTML element
        showCalcDetail: 'true'
    }

    return {
        // public funcs =============================================

        init: function(data, userOpts) {

            // merge together user options and default options
            this.options = {};
            for (var attr in defaultOpts) { this.options[attr] = defaultOpts[attr]; }
            for (var attr in userOpts)    { this.options[attr] = userOpts[attr]; }

            // set up logging
            if (this.options.logTo === 'none' || this.options.logTo === 'console') {
                this.log = logFactory(this.options.logTo, this.options.logLevel);
            } else {
                this.log = logFactory('dom', this.options.logLevel, this.options.logTo);
            }

            // work out the DOM elements
            this.form = this.options.form;
            if (typeof this.form === 'string') {
                this.form = document.getElementById(this.form);
            }
            this.output = this.options.output;
            if (typeof this.output === 'string') {
                this.output = document.getElementById(this.output);
            }

            // store user data
            this.data = data;
            if (data.table) {
                this.table = this.parseTable(data.table);
            }

            this.askVars = [];
            this.tableVars = [];
            this.calcVars = [];
            data.vars.forEach( function(theVar) {
                if (theVar.source === 'ask') {
                    this.askVars.push(theVar.abbr);

                } else if (theVar.source === 'calc') {
                    this.calcVars.push(theVar.abbr);

                } else if (theVar.source === 'table') {
                    this.tableVars.push(theVar.abbr);

                }
            }, this);

            this.buildForm();
        },
        // ----------------------------------------------------------
        buildForm: function() {
            data.vars.forEach( function(theVar) {
                if (theVar.source === 'ask') {
                    this.log('creating field to collect "' + theVar.abbr + '" variable', 'debug');

                    var that = this;
                    var html = document.createElement('div');
                    html.setAttribute('class', 'form-element');

                    html.innerHTML += '<label for="var-' + theVar.abbr + '">' + theVar.name + '</label>';
                    html.innerHTML += '<input type="number" ' +
                        'id="var-' + theVar.abbr + '" ' +
                        'name="var-' + theVar.abbr + '" ' +
                        'value="' + theVar.defaultVal + '"/>';
                    html.innerHTML += theVar.units;

                    // TODO: add max and min?

                    html.innerHTML += '<span class="var-note" id="var-note-' + theVar.abbr + '"></span>';
                    this.form.appendChild(html);

                    attach(elemId('var-' + theVar.abbr), 'change', function(){ that.calculate(); });
                    attach(elemId('var-' + theVar.abbr), 'keyup',  function(){ that.calculate(); });
                }
            }, this);
            this.calculate();
        },
        // ----------------------------------------------------------
        calculate: function() {

            this.log('Calculating results..', 'debug');
            this.results = {};
            this.output.innerHTML = '';

            if (this.getAskVars()) {
                if (this.tableVars.length > 0) {
                    this.getTableVars();
                }
                if (this.calcVars.length > 0) {
                    this.getCalcVars();
                }

                this.log('Results below:', 'debug');
                this.log(this.results, 'debug');

                this.showResults();
                this.showConclusions();
            }

        },
        // ----------------------------------------------------------
        getAskVars: function() {

            this.log('==== retrieving ask variables', 'debug');

            // collect inputs and check them for validity
            var valuesOkay = true;
            data.vars.forEach( function(theVar) {
                if (theVar.source === 'ask') {
                    var elem = elemId('var-' + theVar.abbr);
                    // clear the warning spot
                    elemId('var-note-' + theVar.abbr).innerHTML = '';
                    if (elem) {
                        var value = elem.value;
                        if (value) {
                            value = parseFloat(value);
                            if (!isNaN(value)) {
                                // okay it's a parseable value.
                                // now check its range.
                                if ((theVar.failMin && value < theVar.failMin) || (theVar.failMax && value > theVar.failMax)) {
                                    // outside of the non-fail range.. fail out.
                                    elemId('var-note-' + theVar.abbr).innerHTML = theVar.failMsg;
                                    valuesOkay = false;
                                } else {
                                    // inside the non-fail range.
                                    if (value < theVar.warnMin || value > theVar.warnMax) {
                                        // outside the tested range..
                                        elemId('var-note-' + theVar.abbr).innerHTML = theVar.warnMsg;
                                    }
                                    this.results[theVar.abbr] = value;
                                }
                            }
                        } else { valuesOkay = false }
                    } else { valuesOkay = false }

                }
            }, this);

            return valuesOkay;
        },
        // ----------------------------------------------------------
        getTableVars: function() {

            this.log('==== calculating tabular results', 'debug');

            var bestRows = []; // indexes of best rows

            // at the start, EVERY row is a candidate for best row
            for (var r = 0; r < this.table.length; r++) {
                bestRows.push(r);
            }

            // work through the input vars finding best matches
            this.data.vars.forEach( function(theVar) {
                if (theVar.source === 'ask') {

                    this.log('testing table rows against var "' + theVar.abbr + '"', 'debug');

                    var truth = this.results[theVar.abbr];
                    var delta = function(a, b) { return Math.abs(a - b); }
                    var bestDelta = delta(this.table[bestRows[0]][theVar.abbr], truth);
                    bestRows.forEach( function(rowIndex) {
                        var candidateDelta = delta(truth, this.table[rowIndex][theVar.abbr]);
                        if ( candidateDelta < bestDelta ) {
                            bestDelta = candidateDelta;
                        }
                    }, this);

                    // now pull out just the rows that are 'best' and make a new bestRows
                    var evenBetterRows = [];
                    bestRows.forEach( function(rowIndex) {
                        if ( delta(truth, this.table[rowIndex][theVar.abbr]) == bestDelta ) {
                            evenBetterRows.push(rowIndex);
                        }
                    }, this);

                    bestRows = evenBetterRows;
                }
            }, this);

            // cool now we've got indexes for the best matches.
            if (bestRows.length > 1) {
                this.log('there are multiple best table rows: ' + bestRows.join(', ') + ' figureit will use the first', 'info');
            }

            var bestRow = bestRows[0];

            // record the results
            this.data.vars.forEach( function(theVar) {
                if (theVar.source === 'table') {
                    this.results[theVar.abbr] = this.table[bestRow][theVar.abbr];
                }
            }, this);

        },
        // ----------------------------------------------------------
        getCalcVars: function() {

            this.log('==== calculating formula-based results', 'debug');

            this.data.vars.forEach( function(theVar) {
                if (theVar.source === 'calc') {
                    if (theVar.terms.length != theVar.coefficients.length) {
                        this.log('"' + theVar.abbr + '" has mismatched terms and coefficients!', 'warn');
                    } else {
                        // we'll loop downward through the terms
                        var term = theVar.terms.length;
                        // ..and sum them into this var.
                        var sum = 0;

                        // track info about each term
                        this.results[theVar.abbr + '_termsInfo'] = [];

                        // loop through the terms, working each one out and adding them up
                        while (term--) {
                            var termInfo = {};

                            // loop through vars replace each one in the expression
                            var expression = theVar.terms[term];
                            termInfo.exprInitial = expression;

                            data.vars.forEach( function(inputVar) {
                                expression = expression.replace(inputVar.abbr, '('+ this.results[inputVar.abbr] +')');
                            }, this);

                            termInfo.exprReplaced = expression;
                            termInfo.exprResult = eval(expression);
                            termInfo.coefficient = theVar.coefficients[term];

                            // now evaluate the expression and multiply by the coefficient
                            var thisTerm = theVar.coefficients[term] * eval(expression);
                            termInfo.result = thisTerm;
                            sum += thisTerm;
                            this.results[theVar.abbr + '_termsInfo'].unshift(termInfo);
                        }

                        // remember this value in this.results

                        if (theVar.rounding === undefined) {
                            this.results[theVar.abbr] = sum;
                        } else {
                            // apply the rounding if it's specified
                            this.results[theVar.abbr] = parseFloat(sum.toFixed(theVar.rounding));
                            this.results[theVar.abbr + '_precise'] = sum;
                        }

                        // apply the capping, if specified
                        var sumStr = sum.toFixed(theVar.rounding);
                        if (theVar.lowcap && sum < theVar.lowcap) {
                            sumStr =
                            this.results[theVar.abbr + '_capped'] = '< ' + theVar.lowcap;
                        } else if (theVar.highcap && sum > theVar.highcap) {
                            sumStr = '> ' + theVar.highcap;
                            this.results[theVar.abbr + '_capped'] = '> ' + theVar.highcap;
                        }
                    }
                }
            }, this);
        },
        // ----------------------------------------------------------
        showResults: function() {

            this.log('==== displaying results', 'debug');

            this.data.vars.forEach( function(theVar) {
                if (theVar.source !== 'ask' && !theVar.hidden) {

                    result = this.results[theVar.abbr + '_capped'] || this.results[theVar.abbr];
                    resultPrecise = this.results[theVar.abbr + '_precise'];
                    resultTermsInfo = this.results[theVar.abbr + '_termsInfo'];

                    var resultDiv = '<div id="calc-' + theVar.abbr + '" class="calcwrapper"><div class="result"><span class="name">' + theVar.name + '</span> ';
                    if (resultPrecise) {
                        resultDiv += '<span class="value" title="raw value: ' + resultPrecise + ' ' + theVar.units + '">' + (result || '-') + '</span>';
                    } else {
                        resultDiv += '<span class="value">' + (result || '-') + '</span>'
                    }
                    resultDiv += '<span class="units">' + theVar.units + '</span></div>';

                    // debug: show terms and coefficients.
                    if (this.options.showCalcDetail && resultTermsInfo) {
                        // make a list of columns to show
                        var columns = [];
                        for (var col in resultTermsInfo[0]) { columns.push(col) }
                        columns.sort();

                        var info = '';
                        info += '<button class="show info" onclick="document.getElementById(\'calc-' + theVar.abbr + '\').className = \'calcwrapper wide\';">&gt;</button>';
                        info += '<button class="hide info" onclick="document.getElementById(\'calc-' + theVar.abbr + '\').className = \'calcwrapper\';">&lt;</button>';
                        info += '<div class="calcinfo"><table>';
                        info += '<tr><td colspan="' + columns.length + '">Actual: ' + resultPrecise + '</td></tr>';
                        columns.forEach( function(colName) { info += '<th>' + colName + '</th>'; });
                        resultTermsInfo.forEach( function(termInfo) {
                            info += '<tr>';
                            columns.forEach( function(colName) {
                                if (typeof termInfo[colName] === 'number') {
                                    info += '<td style="text-align: right" title="' + termInfo[colName] + '">';
                                    // info += termInfo[colName].toExponential(5);
                                    info += termInfo[colName].toFixed(2);
                                } else {
                                    info += '<td>';
                                    info += termInfo[colName];
                                }
                                info += '</td>';
                            });
                        });
                        info += '</table></div>';
                        resultDiv += info;
                    }
                    resultDiv += '</div>';
                    this.output.innerHTML += resultDiv;
                }
            }, this);
        },
        // ----------------------------------------------------------
        showConclusions: function() {

            this.log('==== displaying conclusions', 'debug');

            data.conclusions.forEach( function(conc) {

                var condition = conc.condition;
                var content = conc.content;

                this.log('evaluating conclusion with condition: ' + condition, 'debug');

                this.data.vars.forEach( function(theVar) {
                    var varValue = this.results[theVar.abbr];
                    condition = condition.split(theVar.abbr).join('(' + (varValue || 'false') + ')');
                    content = content.split('$$' + theVar.abbr).join(varValue);
                }, this);

                this.log(' ..condition is: ' + condition, 'debug');

                if (eval(condition)) {
                    this.log(' ..conclusion is true', 'debug');
                    this.output.innerHTML += '<div class="conclusion">' + content + '</div>';
                } else {
                    this.log(' ..conclusion is false', 'debug');
                    if (this.options.debug) {
                        this.output.innerHTML += '<div class="conclusion" style="opacity: 0.33"><span style="background: #ccc; padding: 0.2em 0.5em; position: relative; top: -0.1em; font-size: 66%; font-weight: bold">not showing:' + conc.condition + '</span> ' + content + '</div>';
                    }
                }
            }, this);
        },
        // ----------------------------------------------------------
        parseTable: function(tableStrs) {
            var table = [];
            tableStrs.forEach( function(rowStr) {
                var row = {};
                var values = rowStr.split(/\s*,\s*/);
                values.forEach( function(value, valueIndex) {
                    row[data.columnOrder[valueIndex]] = (value === '-' ? undefined : parseInt(value));
                });
                table.push(row);
            });
            return table;
        },
        // ----------------------------------------------------------
        noConflict: function() {
            window.figureit = oldFigureit;
        }
        // ----------------------------------------------------------
    };
}));
