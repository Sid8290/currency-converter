const API_URL = "https://api.frankfurter.dev/v2";

const form = document.querySelector("#converter-form");
const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#from-currency");
const toSelect = document.querySelector("#to-currency");
const swapButton = document.querySelector("#swap-button");
const convertButton = document.querySelector("#convert-button");
const statusMessage = document.querySelector("#status");
const resultFrom = document.querySelector("#result-from");
const resultAmount = document.querySelector("#result-amount");
const resultRate = document.querySelector("#result-rate");
const resultDate = document.querySelector("#result-date");

let hasResult = false;

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`.trim();
}

function formatAmount(value) {
  if (value > 0 && value < 0.01) {
    return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatRate(rate) {
  return rate.toLocaleString(undefined, { maximumSignificantDigits: 6 });
}

function fillDropdown(select, currencies, defaultCode) {
  select.innerHTML = "";

  currencies.forEach((currency) => {
    const option = document.createElement("option");
    option.value = currency.iso_code;
    option.textContent = `${currency.iso_code} - ${currency.name}`;
    select.appendChild(option);
  });

  if (currencies.some((currency) => currency.iso_code === defaultCode)) {
    select.value = defaultCode;
  }
}

async function loadCurrencies() {
  showStatus("Loading currencies...", "info");

  try {
    const response = await fetch(`${API_URL}/currencies`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const currencies = await response.json();

    fillDropdown(fromSelect, currencies, "USD");
    fillDropdown(toSelect, currencies, "INR");

    convertButton.disabled = false;
    swapButton.disabled = false;
    showStatus("");
  } catch (error) {
    console.error(error);
    showStatus("Could not load currencies. Check your internet connection and refresh the page.", "error");
  }
}

function setLoading(isLoading) {
  convertButton.disabled = isLoading;
  swapButton.disabled = isLoading;
  convertButton.textContent = isLoading ? "Converting..." : "Convert";

  if (isLoading) {
    showStatus("Fetching the latest exchange rate...", "info");
  }
}

function displayResult(amount, from, to, rate, date) {
  resultFrom.textContent = `${formatAmount(amount)} ${from} =`;
  resultAmount.textContent = `${formatAmount(amount * rate)} ${to}`;
  resultRate.textContent = `1 ${from} = ${formatRate(rate)} ${to}`;
  resultDate.textContent = date ? `Rate date: ${date}` : "Same currency - no API request needed";
  hasResult = true;
}

function clearResult() {
  resultFrom.textContent = "Result";
  resultAmount.textContent = "\u2014";
  resultRate.textContent = "Exchange rate will appear here";
  resultDate.textContent = "";
  hasResult = false;
}

async function convertCurrency() {
  const amount = Number(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!Number.isFinite(amount) || amount <= 0) {
    clearResult();
    showStatus("Please enter a valid amount greater than 0.", "error");
    return;
  }

  if (from === to) {
    displayResult(amount, from, to, 1, null);
    showStatus("");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/rate/${from}/${to}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "The API returned an error.");
    }

    displayResult(amount, from, to, data.rate, data.date);
    showStatus("");
  } catch (error) {
    console.error(error);
    clearResult();
    showStatus("Could not fetch the exchange rate. Please check your connection and try again.", "error");
  } finally {
    setLoading(false);
  }
}

function swapCurrencies() {
  const previousFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = previousFrom;

  if (hasResult) {
    convertCurrency();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  convertCurrency();
});

swapButton.addEventListener("click", swapCurrencies);

loadCurrencies();