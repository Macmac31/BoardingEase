import { listings } from "./data.js";

// ELEMENTS
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const maxRentInput = document.querySelector("#max-rent");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const detailPanel = document.querySelector("#detail-panel");

// STATE
let visibleListings = listings;
let selectedId = null;
let occupants = 1;
let includeTransport = false;

const SCHOOL_DAYS_PER_MONTH = 22;

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

// ---- filtering ----

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const maxRent = maxRentInput.value;

  visibleListings = listings.filter((listing) => {
    const matchesQuery =
      query === "" || listing.name.toLowerCase().includes(query);

    const matchesRent =
      maxRent === "" || listing.monthlyRent <= Number(maxRent);

    return matchesQuery && matchesRent;
  });

  renderResults();
}

// ---- cost math ----

function sumUtilities({ electricity = 0, water = 0, internet = 0 }) {
  return electricity + water + internet;
}

function calculateCostPerHead(listing, people, withTransport) {
  if (!Number.isInteger(people) || people < 1) {
    throw new Error("Number of occupants must be a whole number, at least 1.");
  }
  if (people > listing.maxOccupants) {
    throw new Error(
      `This listing allows at most ${listing.maxOccupants} occupants.`,
    );
  }

  const rentPerHead = listing.monthlyRent / people;

  const utilitiesPerHead = listing.utilitiesIncluded
    ? 0
    : sumUtilities(listing.estimatedUtilities) / people;

  const transportPerHead = withTransport
    ? listing.fareOneWay * 2 * SCHOOL_DAYS_PER_MONTH
    : 0;

  return {
    rentPerHead,
    utilitiesPerHead,
    transportPerHead,
    totalPerHead: rentPerHead + utilitiesPerHead + transportPerHead,
  };
}

// ---- markup ----

function cardMarkup(listing) {
  const { id, name, barangay, monthlyRent, distanceToCampusKm, utilitiesIncluded } =
    listing;

  const utilitiesTag = utilitiesIncluded
    ? `<span class="tag tag--utilities">Utilities included</span>`
    : `<span class="tag tag--utilities">Utilities extra</span>`;

  return `<li>
    <button class="card" type="button" data-id="${id}" aria-pressed="${id === selectedId}">
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
        <span class="card__meta">${barangay} &middot; ${distanceToCampusKm} km from campus</span>
        <span class="card__rent">${peso.format(monthlyRent)} / month</span>
        <span class="tags">${utilitiesTag}</span>
      </span>
    </button>
  </li>`;
}

function breakdownMarkup(listing) {
  const { rentPerHead, utilitiesPerHead, transportPerHead, totalPerHead } =
    calculateCostPerHead(listing, occupants, includeTransport);

  return `
    <p class="breakdown__line"><span>Rent</span><span>${peso.format(rentPerHead)}</span></p>
    <p class="breakdown__line"><span>Utilities</span><span>${peso.format(utilitiesPerHead)}</span></p>
    <p class="breakdown__line"><span>Transport</span><span>${peso.format(transportPerHead)}</span></p>
    <p class="breakdown__total"><span>Per person</span><span>${peso.format(totalPerHead)}</span></p>
  `;
}

function detailMarkup(listing) {
  const { name, barangay, monthlyRent, maxOccupants } = listing;

  let body;
  try {
    body = breakdownMarkup(listing);
  } catch (err) {
    body = `<p class="error">${err.message}</p>`;
  }

  return `
    <h2 class="detail__name">${name}</h2>
    <p class="detail__where">${barangay} &middot; ${peso.format(monthlyRent)} / month</p>

    <fieldset class="splitter">
      <legend class="splitter__legend">Split the cost</legend>

      <div class="splitter__row">
        <label for="occupants">Sharing with</label>
        <input class="field__input" type="number" id="occupants"
               min="1" max="${maxOccupants}" value="${occupants}">
      </div>

      <div class="splitter__row">
        <label for="transport">Include daily fare</label>
        <input type="checkbox" id="transport" ${includeTransport ? "checked" : ""}>
      </div>
    </fieldset>

    <div class="breakdown">${body}</div>
  `;
}

// ---- rendering ----

function renderResults() {
  if (visibleListings.length === 0) {
    resultsList.innerHTML =
      '<li class="empty">No listings match that search. Try a barangay name.</li>';
    resultCount.textContent = "No results";
    return;
  }

  resultsList.innerHTML = visibleListings.map(cardMarkup).join("");
  resultCount.textContent = `${visibleListings.length} listing${visibleListings.length === 1 ? "" : "s"} found`;
}

function selectedListing() {
  return listings.find((listing) => listing.id === selectedId);
}

function renderDetail() {
  if (!selectedId) {
    detailPanel.innerHTML =
      '<p class="detail__empty">Select a listing to see the cost breakdown.</p>';
    return;
  }

  const listing = selectedListing();
  if (!listing) {
    detailPanel.innerHTML = '<p class="error">That listing could not be found.</p>';
    return;
  }

  detailPanel.innerHTML = detailMarkup(listing);
}

// Only touches the numbers, not the whole panel -- so the "Sharing with"
// input never gets rebuilt (and never loses focus) while you're typing in it.
function updateBreakdown() {
  const breakdown = detailPanel.querySelector(".breakdown");
  const listing = selectedListing();
  if (!breakdown || !listing) return;

  try {
    breakdown.innerHTML = breakdownMarkup(listing);
  } catch (err) {
    breakdown.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// ---- events ----

resultsList.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;

  selectedId = card.dataset.id;
  const listing = selectedListing();
  if (!listing) return;

  occupants = listing.maxOccupants;
  includeTransport = false;

  renderResults();
  renderDetail();
});

detailPanel.addEventListener("input", (event) => {
  if (event.target.id === "occupants") {
    occupants = Number(event.target.value);
    updateBreakdown();
  }
  if (event.target.id === "transport") {
    includeTransport = event.target.checked;
    updateBreakdown();
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});
searchInput.addEventListener("input", applyFilters);
maxRentInput.addEventListener("input", applyFilters);

// ---- initial render ----
applyFilters();
renderDetail();

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