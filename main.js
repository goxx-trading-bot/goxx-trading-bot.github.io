

const SYMBOLS=[
    "BTC", 
    "ETH", 
    "BNB", 
    "SOL", 
    "ADA", 
    "XRP", 
    "DOT" ,
    "DOGE", 
    "AVAX" ,
    "SHIB" ,
    "LUNA" ,
    "LTC" ,
    "UNI" ,
    "MATIC" ,
    "LINK" ,
    "BCH" ,
    "EGLD" ,
    "XLM" ,
    "VET" ,
    "ICP" ,
    "TRX"
];
var WALLET=[]
var BALANCE=300

async function sleep(t=50) {
    return new Promise(r => setTimeout(() => r(), t));
}

async function main() {


    buildWheel();

    await bootstrap ();
    await updateWallet();


    while (true) {

        var next = nextBid();
        while (next > 0) {
            next--;
            $("#message").html("Next order will be placed in " + next + "s");
            await sleep(1000);
        }

        var symbol = await turnTheWHeel()
        var b = await buyOrSell()
        if (b) {
            await buy(symbol, 20);
        } else {
            await sell(symbol);
        }

        next = nextLoop();
        while (next > 0) {
            next--;
            $("#message").html("The office is closed. It will open in " + next + "s");
            await sleep(1000);
        }
    }

}

function buildWheel() {
    var t="<tbody><tr>";
    var i = 0;
    for (var s of SYMBOLS) {
        var color = (i++ % 2)?"lightgrey":"white";
        t+='<td id="'+s+'" style="background-color: '+color+'; padding: 3px;">'+s+'</td>';
    }
    t+="</tr></tbody>";
    $("#symbols ").html(t);
}

function nextBid() {
    var d = new Date();
    return Math.floor(Math.random() * 59) * 60;
}

function nextLoop() {
    var d = new Date();
    return (60 - d.getMinutes()) * 60;
}


async function bootstrap () {

    var pricelist = await quoteAll();

    for (var symbol of SYMBOLS) {
        for (var price of pricelist) {
            if (symbol+'EUR' == price.symbol) {

                var order = 5;
                if (BALANCE < order) {
                    order = BALANCE;
                }
            
                if (order > 0) {
            
                    BALANCE = BALANCE - order;
            
                    // Fees
                    order *= 0.999;
                    var tokens = order / price.price;
            
                    if (!WALLET[symbol]) {
                        WALLET[symbol] = 0;
                    }
            
                    var value=parseFloat(tokens.toFixed(8));
                    WALLET[symbol] += value;
            
                } else {
                    console.log("Balance too low")
                }

                break;
            }
        }
    }
    
}

async function turnTheWHeel () {


    var n = Math.floor(Math.random() * (SYMBOLS.length - 1));
    var symbol = SYMBOLS[n];


    var i = 0;
    var t="<tbody><tr>";
    for (var s of SYMBOLS) {
        var color = (i++ % 2)?"lightgrey":"white";
        t+='<td id="'+s+'" style="background-color: '+color+'; padding: 3px;">'+s+'</td>';
    }
    t+="</tr></tbody>";
    $("#symbols ").html(t);

    for (var i=0; i < 3; i++) {

        for (var td of $("#symbols td")) {
            
            var color = td.style["background-color"];
            td.style["background-color"] = "gold";

            if (i == 2 && td.textContent == symbol) {
                break;
            }

            await sleep();
            td.style["background-color"] = color;
        }
    }

    return symbol;
}

async function buyOrSell () {

    var buy = (Math.random() > 0.5)?true:false;


    for (var i=0; i < 3; i++) {

        $("#buy")[0].style["background-color"] = "lightgreen";
        if (i == 2 && buy) {
            break;
        }
        await sleep(150);
        $("#buy")[0].style["background-color"] = "white";
        $("#sell")[0].style["background-color"] = "red";
        if (i == 2 && !buy) {
            break;
        }
        await sleep(150);
        $("#sell")[0].style["background-color"] = "white";

    }

    return buy;
}

async function quote (symbol) {
    // Do not overload Binance API
    await sleep(1000)

    return $.ajax(
        {
            url: 'https://api.binance.com/api/v3/ticker/price?symbol='+symbol+'EUR'
        });

}

async function quoteAll () {
    // Do not overload Binance API
    await sleep(1000)

    return $.ajax(
        {
            url: 'https://api.binance.com/api/v3/ticker/price'
        });
}

async function buy(symbol, amount, silent=false) {

    var order = amount;
    if (BALANCE < order) {
        order = BALANCE;
    }

    if (order > 0) {
        var q = await quote(symbol);
    

        BALANCE = BALANCE - order;

        // Fees
        order *= 0.999;
        var tokens = order / q.price;

        if (!WALLET[symbol]) {
            WALLET[symbol] = 0;
        }

        var value=parseFloat(tokens.toFixed(8));
        WALLET[symbol] += value;

        if (!silent) {

            addToOrderBook("BUY", symbol,   value, q.price, order); 
        }

    } else {
        console.log("Balance too low")
    }

}


async function sell (symbol) {
    
    if (WALLET[symbol] && WALLET[symbol] > 0) {
        var q = await quote(symbol);
        var tokens = WALLET[symbol];
        var value = parseFloat((WALLET[symbol] * q.price * .999).toFixed(8))
        BALANCE +=  value;
        WALLET[symbol] = 0;

        addToOrderBook("SELL", symbol, tokens , q.price, value); 
    } else {
        console.log("Nothing to sell")
    }
}

async function addToOrderBook (action, symbol, tokens, price, amount) {

    var d = new Date();
    var t = "<tr>";
    t += "<td>" + d.toLocaleDateString("FR")+" "+d.getHours()+":"+ ((d.getMinutes() <10)?"0":"") + d.getMinutes() + "</td>";
    if (action == "BUY") {
        t += "<td style='background-color: lightgreen'><b>" + action + "</b></td>";
    } else {
        t += "<td style='background-color: red'><b>" + action + "</b></td>";
    }
    t += "<td>" + symbol + "</td>";
    t += "<td>" + tokens + "</td>";
    t += "<td>" + price + "</td>";
    t += "<td>" + amount.toFixed(4) + "</td>";
    t += "</tr>";
    $("#orders tbody ").append(t);

    updateWallet();

}

function cleanWallet() {
    var t = '<tr style="background-color: lightgrey;"><td>CURRENCY</td><td>#TOKENS</td><td>VALUE</td></tr>';
    
    for (var w in WALLET) {
        t +="<tr>";
        t += "<td>" + w + "</td>";
        t += "<td>" + WALLET[w] + "</td>";
        t += "<td>" + "-" + "</td>";
        t += "</tr>";
    }

    t +="<tr>";
    t += "<td>" + "EUR" + "</td>";
    t += "<td>" + "-" + "</td>";
    t += "<td>" + BALANCE.toFixed(8) + "</td>";
    t += "</tr>";

    t +="<tr >";
    t += "<td>" + "Total" + "</td>";
    t += "<td>" + "-" + "</td>";
    t += "<td style='border: 1px solid black';font-weight:bold;>-</td>";
    t += "</tr>";
    $("#wallet tbody ").html(t);
}

async function updateWallet() {

    cleanWallet()

    var q = await quoteAll();

    var t = '<tr style="background-color: lightgrey;"><td>CURRENCY</td><td>#TOKENS</td><td>VALUE</td></tr>';
    var total = BALANCE;
    for (var w in WALLET) {
        var value = 0;
        for (var p of q) {
            if (p.symbol == w+'EUR') {
                value = parseFloat((WALLET[w] * p.price).toFixed(4));
                break;
            }
        }
        
        total += value;

        t +="<tr>";
        t += "<td>" + w + "</td>";
        t += "<td>" + WALLET[w].toFixed(8) + "</td>";
        t += "<td>" + value + "</td>";
        t += "</tr>";
    }

    t +="<tr>";
    t += "<td>" + "EUR" + "</td>";
    t += "<td>" + "-" + "</td>";
    t += "<td>" + BALANCE.toFixed(2) + "</td>";
    t += "</tr>";

    t +="<tr >";
    t += "<td>" + "Total" + "</td>";
    t += "<td>" + "-" + "</td>";
    t += "<td style='border: 1px solid black';font-weight:bold;>" + total.toFixed(2) + "</td>";
    t += "</tr>";
    $("#wallet tbody ").html(t);
}

