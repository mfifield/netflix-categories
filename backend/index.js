const fs = require('fs'),
    rp = require('request-promise'),
    cheerio = require('cheerio'),
    Entities = require('html-entities').XmlEntities,
    entities = new Entities(),
    outputFile = 'output.json',
    urlData = {
        uri: 'https://www.whats-on-netflix.com/news/the-netflix-id-bible-every-category-on-netflix',
        transform: function (body) {
            return cheerio.load(body);
        }
    };

// Initialise the category generation
exports.initialise = function () {
    var day = 86400000;
    // Schedule a daily process
    setInterval(() => {
        generate.then(() => {
            var currentDate = new Date(Date.now()).toLocaleString();
            console.log(`File updated on: ${currentDate}`);
        })
    }, day);
    return generate = generateData().then(function (result) {
        saveData(result);
    });
}

// Save the category data to a JSON file
const saveData = function (jsonArray) {
    return new Promise((resolve, reject) => {
        fs.writeFile(outputFile, JSON.stringify(jsonArray, null, 4), error => {
            console.log('output.json category file successfully updated');
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}

// Scrape the data and format it into a sensible structure
const generateData = function () {
    return rp(urlData).then($ => {
        const re = new RegExp('[0-9]{1,9} [=] [a-zA-Z]{2,30}.*?(?=<|$)');
        var returnArray = [], tempArray = [], mainCatIndex = 0, mainCatCounter = 0;
        $('#page .entry-inner').find('p').each(function (i, element) {
            const theText = $(this).html();
            tempArray[i] = $(this);
            if (re.test(theText)) {
                // If the previous paragraph tag contains an image, we know this is a main catagory (e.g. Action)
                var isMainCategory = (i > 0 && tempArray[i - 1]).find('img').length ? true : false;
                // Some paragraph tags contain line breaks seperating categories, so loop through these
                theText.split('<br>').forEach(element => {
                    var [currentCatId, description] = element.split('=');
                    currentCatId = parseInt(currentCatId);
                    description = entities.decode(description).trim();
                    if (isMainCategory) {
                        mainCatIndex = mainCatCounter++;
                        returnArray.push({ "catId": currentCatId, "category": description, "subCategories": [] });
                    } else {
                        returnArray[mainCatIndex].subCategories.push({ "catId": currentCatId, "category": description });
                    }
                });
                // Sort the subcategories
                returnArray[mainCatIndex].subCategories.sort((a, b) => a.category.localeCompare(b.category));
            }
        });
        return returnArray;
    }).catch(error => {
        console.log(`There has been a problem: ${error}`);
    });
}