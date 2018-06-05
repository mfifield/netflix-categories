const fs = require('fs'),
    rp = require('request-promise'),
    cheerio = require('cheerio'),
    Entities = require('html-entities').XmlEntities,
    entities = new Entities(),
    outputFile = 'output.json',
    urlData = {
        uri: 'https://www.whats-on-netflix.com/news/the-netflix-id-bible-every-category-on-netflix',
        transform: (body) => {
            return cheerio.load(body);
        }
    };

// Initialise the category generation
exports.initialise = () => {
    var day = 86400000;
    // Schedule a daily process
    setInterval(() => {
        generate.then(() => {
            var currentDate = new Date(Date.now()).toLocaleString();
            console.log(`File updated on: ${currentDate}`);
        });
    }, day);
    return generate = generateData().then(function (result) {
        saveData(result);
    });
};

// Save the category data to a JSON file
const saveData = (jsonArray) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(outputFile, JSON.stringify(jsonArray, null, 4), error => {
            console.log('output.json category file successfully updated');
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
};

// Scrape the data and format it into a sensible structure
const generateData = () => {
    return rp(urlData).then($ => {
        const re = new RegExp('[0-9]{1,9} [=] [a-zA-Z]{2,30}.*?(?=<|$)');
        var resultArray = [], domArray = [], mainCatIndex = 0, mainCatCounter = 0;
        $('#page .entry-inner').find('p').each(function (i, element) {
            const theText = $(this).html();
            domArray[i] = $(this);
            if (re.test(theText)) {
                // If the previous paragraph tag contains an image, we know this is a main catagory (e.g. Action)
                var isMainCategory = (i > 0 && domArray[i - 1]).find('img').length;
                // Some paragraph tags contain line breaks seperating categories, so loop through these
                theText.split('<br>').forEach(element => {
                    var [currentCatId, description] = element.split('=');
                    currentCatId = parseInt(currentCatId);
                    description = entities.decode(description).trim();
                    if (isMainCategory) {
                        if (mainCatCounter !== 0) {
                            // Sort the subcategories
                            resultArray[mainCatCounter-1].subCategories.sort((a, b) => a.category.localeCompare(b.category));
                        }
                        mainCatIndex = mainCatCounter++;
                        resultArray.push({ "catId": currentCatId, "category": description, "subCategories": [] });
                    } else {
                        resultArray[mainCatIndex].subCategories.push({ "catId": currentCatId, "category": description });
                    }
                });
            }
        });
        return resultArray;
    }).catch(error => {
        console.log(`There has been a problem: ${error}`);
    });
};