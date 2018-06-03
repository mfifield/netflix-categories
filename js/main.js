const dataSource = '/output.json',
    netflixUrl = 'http://www.netflix.com/browse/genre/';
var originalDataSet = {};

// Provide a friendly iterable for Nodes
NodeList.prototype.forEach = NodeList.prototype.forEach || Array.prototype.forEach;

// Make an ajax request for the category data
const loadData = (url) => {
    const promiseObj = new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(xhr.status);
                }
            }
        };
    });
    return promiseObj;
};

// If there's an error with the ajax request
const ajaxErrorHandler = (error) => {
    console.log(`Error: ${error}`);
};

// Generate category lists for the dataset
const generateCategories = (dataSet, showSubCats) => {
    var generatedMarkup1 = '', generatedMarkup2 = '';
    if (dataSet.length === 0) {
        generatedMarkup1 = '<p>Sorry, there are no categories that match your criteria</p>';
    } else {
        dataSet.forEach(mainCategory => {
            generatedMarkup2 = '<ul>';
            mainCategory.subCategories.forEach((subCategory, i) => {
                if (i % 5 === 0 && i !== 0) {
                    generatedMarkup2 += '</ul><ul>';
                }
                generatedMarkup2 += `
                <li><a href="${netflixUrl}${subCategory.catId}">
                <span class="icon-new-tab bullet"></span>${subCategory.category}</a></li>`;
            });
            generatedMarkup1 += `
            <li><button class="toggle ${showSubCats ? 'icon-circle-down' : 'icon-circle-right'}">
            </button><a href="${netflixUrl}${mainCategory.catId}">${mainCategory.category}</a>
            <div class="subcat-container ${showSubCats ? 'show' : ''}">${generatedMarkup2}</ul></div></li>`;
        });
        generatedMarkup1 = `<ul class="category-list">${generatedMarkup1}</ul>`;
    }
    document.querySelector('#categories').innerHTML = generatedMarkup1;
};

// Filter the result set by partial string matching
const filterResults = (value) => {
    var filteredResults = [], matchArray = [];
    if (value.length > 0) {
        originalDataSet.forEach((mainCategory) => {
            matchArray = mainCategory.subCategories.filter(subCategory => {
                return (subCategory.category.toLowerCase().indexOf(value) !== -1);
            });
            if (mainCategory.category.toLowerCase().indexOf(value) !== -1 || matchArray.length > 0) {
                filteredResults.push({ "catId": mainCategory.catId, 
                "category": mainCategory.category, "subCategories": matchArray });
            }
        });
        generateCategories(filteredResults, true);
    } else {
        generateCategories(originalDataSet);
    }
};

// Toggle the subcategory visibility
const toggleCategory = (event) => {
    var toggleButton = event.target, parent = toggleButton.parentNode, subContainer = parent.querySelector('.subcat-container');
    event.currentTarget.querySelectorAll('a').forEach(node => node.setAttribute('class', ''));
    var classArray = toggleButton.getAttribute('class').indexOf('down') === -1 ? 
    ['toggle icon-circle-down','subcat-container show'] : ['toggle icon-circle-right','subcat-container hide'];
    toggleButton.setAttribute('class', classArray[0]);
    subContainer.setAttribute('class', classArray[1]);
};

// Bind listeners to categegory toggles and filtering
const bindEventListeners = () => {
    document.querySelector('#categories').addEventListener('click', function (event) {
        if (event.target.tagName === 'BUTTON') {
            toggleCategory(event);
        }
    });
    document.querySelector('#filter').addEventListener('input', function (event) {
        var target = event.target,
            cssClass = target.value.length > 0 ? 'has-focus' : '';
        target.setAttribute('class', cssClass);
        filterResults(target.value.toLowerCase());
    });
    document.querySelector('header button.icon-search').addEventListener('click', function (event) {
        document.querySelector('#filter').focus();
    });
};

// When DOM has loaded render the content
document.addEventListener('DOMContentLoaded', function () {
    loadData(dataSource).then((result, ajaxErrorHandler) => {
        originalDataSet = result;
        generateCategories(originalDataSet);
        bindEventListeners();
        // Prevent FOUC (remove the no-js class on the HTML element)
        (function(H) { H.className = H.className.replace(/\bno-js\b/, 'js') })(document.documentElement);
    });
}, false);