import { listings } from "./data.js";

let newListings = listings;

const resultsList = document.querySelector(".results__list");
const detailsContainer = document.querySelector(".detail");
const searchCount = document.querySelector(".search__count");
const fieldInput = document.querySelector(".field__input");
const maxRentInput = document.querySelector("#max-rent");
const searchForm = document.querySelector("#search-form");


const markupGenerator = (listing) => {
  // Gi destructure nato dire ang object
  const {
    id,
    name,
    barangay,
    monthlyRent,
    maxOccupants,
    utilitiesIncluded,
    estimatedUtilities,
    distanceToCampusKm,
    fareOneWay,
    amenities,
  } = listing;

  const utilitiesTag = utilitiesIncluded
    ? `<span class="tag tag--utilities"
                      >Utilities extra</span
                    >`
    : `<span class="tag tag--utilities"
                      >No Utilities extra</span
                    >`;

  return `<li>
              <button
                class="card"
                type="button"
                data-id="${id}"
                aria-pressed="false"
              >
                <img
                  class="card__image"
                  alt=""
                  width="96"
                  height="96"
                  loading="lazy"
                  src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' fill='%23e8f2ee'/><path d='M20 62l18-20 14 16 10-10 14 14v10H20z' fill='%231e7a5f' opacity='.45'/><circle cx='64' cy='32' r='7' fill='%231e7a5f' opacity='.45'/></svg>"
                />
                <span>
                  <span class="card__name">${name}</span>
                  <span class="card__meta"
                    >${barangay} &middot; ${distanceToCampusKm} km from campus &middot; up to 4</span
                  >
                  <span class="card__rent">&#8369;${monthlyRent} / month</span>
                  <span class="tags"
                    >
                    ${utilitiesTag}</span
                  >
                </span>
              </button>
            </li>`;
};

const results = () => {
  if (newListings.length === 0) {
    resultsList.innerHTML = `<li class="empty">
              No listings match that search. Try a barangay name.
            </li>`;

    searchCount.textContent = "0 listings found";
  }

  resultsList.innerHTML = newListings.map(markupGenerator).join("");
};

results();

// Create event listener for the search field.
// Show the results
// Revert the list when search value is empty

  const detailMarkUpGenerator = (listing) => {
  const { name, barangay, monthlyRent } = listing;

  return `
   <h2 class="detail__name">${name}</h2>
          <p class="detail__where">${barangay} &middot; &#8369;${monthlyRent} / month</p>
  <fieldset class="splitter">
            <legend class="splitter__legend">Split the cost</legend>

            <div class="splitter__row">
              <label for="occupants-demo">Sharing with</label>
              <input
                class="field__input"
                type="number"
                id="occupants-demo"
                min="1"
                max="4"
                value="4"
              />
            </div>

            <div class="splitter__row">
              <label for="transport-demo">Include daily fare</label>
              <input type="checkbox" id="transport-demo" checked />
            </div>
          </fieldset>

          <div class="breakdown">
            <p class="breakdown__line">
              <span>Rent</span><span>&#8369;1,625</span>
            </p>
            <p class="breakdown__line">
              <span>Utilities</span><span>&#8369;738</span>
            </p>
            <p class="breakdown__line">
              <span>Transport</span><span>&#8369;660</span>
            </p>
            <p class="breakdown__total">
              <span>Per person</span><span>&#8369;3,023</span>
            </p>
          </div>        
  `;
  };

resultsList.addEventListener("click", (event) => {
  const card = event.target.closest(".card");

  if (!card) return;

  const listingID = card.dataset.id;

  const listing = newListings.find((listing) => listingID === listing.id);

  detailsContainer.innerHTML = detailMarkUpGenerator(listing);
});


maxRentInput.addEventListener("input", (e) => {
  const maxRent = e.target.value;
  if (maxRent === "") newListing = listings;
  else
    newListing = listing.filter((listing) => listing.monthlyRent <= maxRent);
  results();
});

const applyFilter = () => {
  const query = fieldInput.value.toLowerCase().trim();
  const maxRent = maxRentInput.value;
  newListing = listing.filter((listing) => {
    const matchesQuery = query === "" || listing.name.includes(query);
    const matchesRent = maxRent === "" || listing.monthlyRent <= Number(maxRent);
    return matchesQuery && matchesRent;
   
  });
   results();

};

fieldInput.addEventListener("input", applyFilter);
maxRentInput.addEventListener("input", applyFilter);
applyFilter();
results();


// SEARCH ADDED FUNCTIONALITY 
/*fieldInput.addEventListener("input", (event) => {
  const searchValue = event.target.value.toLowerCase().trim();

  if (searchValue === "") {
    newListings = listings;
  } else { 
    newListings = listings.filter((listing) =>
      listing.name.toLowerCase().includes(searchValue)
    );
  } 
  results();
  searchCount.textContent = `${newListings.length} listings found`;
});*/
// RENT ADDED FUNCTIONALITY


// ------------- ACTIVITY (Build the search functionality) -------------

// 1. Attach an `input` event listener to the search field (`fieldInput`) so it reacts as the user types.

// 2. Filter and display matches — as text is entered, narrow the listings down to those whose name matches the query, then re-render the results.

// 3. Reset when empty — if the search box is cleared, restore the full list of listings.

// The commented hint at the very bottom points you toward using `.filter()` on the listings array to find entries where the listing name matches what was typed:

// event: input
// const match = listings.filter((listing) => listing.name === searchValue);

// A quick note: strict equality (`===`) only matches an exact, full name. For a real search field you’ll usually want case-insensitive partial matching instead, e.g. `listing.name.toLowerCase().includes(searchValue.toLowerCase())`.
