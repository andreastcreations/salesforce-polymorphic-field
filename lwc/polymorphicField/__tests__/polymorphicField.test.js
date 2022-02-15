import { createElement } from "lwc";
import PolymorphicField from "c/polymorphicField";
import getResults from "@salesforce/apex/PolymorphicFieldHandler.getResults";

const MOCK_COMBOBOX_MAP = require("./data/mockComboboxMap.json");
const MOCK_GET_RESULTS_SUCCESS = require("./data/mockGetResultsSuccess.json");
const MOCK_GET_RESULTS_ERROR = require("./data/mockGetResultsError.json");

jest.mock(
  "@salesforce/apex/MyController.getResults",
  () => {
    return {
      default: jest.fn()
    };
  },
  { virtual: true }
);

describe("UI Elements", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("The component is defined", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      expect(element).toBeDefined();
    });
  });

  it("The component has a label, a button and an input field initially", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    const label = element.shadowRoot.querySelectorAll("label");
    expect(label.length).toBe(1);
    expect(label[0].id).toContain("pf-label-id");
    const button = element.shadowRoot.querySelectorAll("button");
    expect(button.length).toBe(1);
    expect(button[0].id).toContain("pf-objectswitcher-combobox-id");
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");
  });

  it("The component has a red star if required", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    // Not required
    const notRequired = element.shadowRoot.querySelectorAll("abbr");
    expect(notRequired.length).toBe(0);

    // Remove and re-add as required
    document.body.removeChild(element);
    element.required = true;
    document.body.appendChild(element);
    const required = element.shadowRoot.querySelectorAll("abbr");
    expect(required.length).toBe(1);
    expect(required[0].id).toContain("pf-required-star-id");
  });

  it("The component has a help button if withHelp", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    // Not required
    const buttonsWithoutHelp = element.shadowRoot.querySelectorAll("button");
    expect(buttonsWithoutHelp.length).toBe(1);
    expect(buttonsWithoutHelp[0].id).not.toContain("pf-help-button-id");

    // Remove and re-add as required
    document.body.removeChild(element);
    element.withHelp = true;
    element.helpMessage = "Test help message.";
    document.body.appendChild(element);

    const buttonsWithHelp = element.shadowRoot.querySelectorAll("button");
    expect(buttonsWithHelp.length).toBe(2);
    let expectedElements = 0;
    for (const el of buttonsWithHelp) {
      if (el.id.includes("pf-help-button-id")) {
        expectedElements++;
      }
    }
    expect(expectedElements).toBe(1);

    // Check if help bubble is visible without clicking help button
    const bubbleNotClicked = element.shadowRoot.querySelector(
      '[id*="pf-help-bubble-id"]'
    );
    expect(bubbleNotClicked).toBeNull();

    // Check if help bubble appears on click
    element.shadowRoot
      .querySelector('[id*="pf-help-button-id"]')
      .dispatchEvent(new CustomEvent("click"));

    return Promise.resolve().then(() => {
      const bubbleClicked = element.shadowRoot.querySelector(
        '[id*="pf-help-bubble-id"]'
      );
      expect(bubbleClicked).not.toBeNull();
    });
  });

  it("The component has no open lists in the beginning", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    // Closed combobox list
    const button = element.shadowRoot.querySelectorAll("button");
    expect(button.length).toBe(1);
    expect(button[0].id).toContain("pf-objectswitcher-combobox-id");
    expect(button[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );
    // Closed results list
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");
    expect(input[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );
  });
});

describe("Help Button Logic", () => {
  const hey = 0;
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("Test the help button without message", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    element.withHelp = true;
    document.body.appendChild(element);

    // Help button should exist
    const helpButton = element.shadowRoot.querySelector(
      '[id*="pf-help-button-id"]'
    );
    expect(helpButton).not.toBeNull();

    // Help bubble should not exist
    const helpBubbleInitial = element.shadowRoot.querySelector(
      '[id*="pf-help-bubble-id"]'
    );
    expect(helpBubbleInitial).toBeNull();

    return (
      Promise.resolve()
        // Click help button
        .then(() => {
          helpButton.dispatchEvent(new CustomEvent("click"));
        })
        // Help bubble should not exist, because there is no message
        .then(() => {
          const helpBubble = element.shadowRoot.querySelector(
            '[id*="pf-help-bubble-id"]'
          );
          expect(helpBubble).toBeNull();
        })
    );
  });

  it("Test the help button with message", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    element.withHelp = true;
    element.helpMessage = "Test help message";
    document.body.appendChild(element);

    // Help button should exist
    const helpButton = element.shadowRoot.querySelector(
      '[id*="pf-help-button-id"]'
    );
    expect(helpButton).not.toBeNull();

    // Help bubble should not exist
    const helpBubbleInitial = element.shadowRoot.querySelector(
      '[id*="pf-help-bubble-id"]'
    );
    expect(helpBubbleInitial).toBeNull();

    return (
      Promise.resolve()
        // Click help button
        .then(() => {
          helpButton.dispatchEvent(new CustomEvent("click"));
        })
        // Help bubble should exist with correct message
        .then(() => {
          const helpBubble = element.shadowRoot.querySelector(
            '[id*="pf-help-bubble-id"]'
          );
          expect(helpBubble).not.toBeNull();
          expect(helpBubble.textContent).toBe(element.helpMessage);
        })
        // Click anywhere
        .then(() => {
          helpButton.dispatchEvent(new CustomEvent("blur"));
        })
        // Help bubble should disappear
        .then(() => {
          const helpBubble = element.shadowRoot.querySelector(
            '[id*="pf-help-bubble-id"]'
          );
          expect(helpBubble).toBeNull();
        })
    );
  });
});

describe("Combobox Logic", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("Test the combobox and its list of options", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    // Closed combobox
    const button = element.shadowRoot.querySelectorAll("button");
    expect(button.length).toBe(1);
    expect(button[0].id).toContain("pf-objectswitcher-combobox-id");
    expect(button[0].ariaControls).toContain("pf-objectswitcher-listbox-id");
    expect(button[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    // Combobox label
    let comboboxLabels = button[0].getElementsByTagName("strong");
    expect(comboboxLabels.length).toBe(1);
    expect(comboboxLabels[0].textContent).toBe(
      element.comboboxMap[0].option.label
    );

    // Listbox exists
    const listbox = element.shadowRoot.querySelector(
      '[id*="pf-objectswitcher-listbox-id"]'
    );
    expect(listbox).not.toBeNull();

    let listboxItems;
    return (
      Promise.resolve()
        // Click on combobox
        .then(() => {
          button[0].dispatchEvent(new CustomEvent("click"));
        })
        // Check if list is open
        .then(() => {
          expect(button[0].parentElement.parentElement.className).toContain(
            "slds-is-open"
          );
          listboxItems = listbox.getElementsByTagName("li");
          expect(listboxItems.length).toBe(element.comboboxMap.length);
        })
        // Click on combobox while list is open
        .then(() => {
          listbox.dispatchEvent(new CustomEvent("click"));
        })
        // List remains open
        .then(() => {
          expect(button[0].parentElement.parentElement.className).toContain(
            "slds-is-open"
          );
        })
        // Click on 2nd list item
        .then(() => {
          listboxItems[1].dispatchEvent(new CustomEvent("click"));
        })
        // List closes and combobox label changes
        .then(() => {
          expect(button[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
          expect(comboboxLabels[0].textContent).toBe(
            element.comboboxMap[1].option.label
          );
        })
        // Click on combobox one last time
        .then(() => {
          button[0].dispatchEvent(new CustomEvent("click"));
        })
        // Listbox opens again
        .then(() => {
          expect(button[0].parentElement.parentElement.className).toContain(
            "slds-is-open"
          );
        })
        // Click anywhere
        .then(() => {
          document.dispatchEvent(new CustomEvent("click"));
        })
        // Listbox closes
        .then(() => {
          expect(button[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
        })
    );
  });
});

describe("Input Logic", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.resetAllMocks();
  });

  it("Required input", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    element.required = true;
    element.requiredMessage = "Test error message";
    document.body.appendChild(element);

    // Validate input field and closed results list
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");

    return (
      Promise.resolve()
        // Focus on input element
        .then(() => {
          input[0].dispatchEvent(new CustomEvent("focus"));
        })
        // Blur on input element
        .then(() => {
          input[0].dispatchEvent(new CustomEvent("blur"));
        })
        // Verify required, get error message and focus on input element again
        .then(() => {
          expect(element.shadowRoot.firstChild.className).toContain(
            "slds-has-error"
          );

          const errorMessage = element.shadowRoot.querySelector(
            '[id*="pf-error-message-id"]'
          );
          expect(errorMessage).not.toBeNull();
          expect(errorMessage.textContent).toBe(element.requiredMessage);

          input[0].dispatchEvent(new CustomEvent("focus"));
        })
        // Verify still has error after focus and give user input of length 1
        .then(() => {
          expect(element.shadowRoot.firstChild.className).toContain(
            "slds-has-error"
          );

          input[0].value = "a";
          input[0].dispatchEvent(new CustomEvent("input"));
        })
        // Verify error is gone
        .finally(() => {
          expect(element.shadowRoot.firstChild.className).not.toContain(
            "slds-has-error"
          );
        })
    );
  });

  it("Empty input value or with length less than 2", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    // Validate input field and closed results list
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");
    expect(input[0].ariaControls).toContain("pf-search-results-listbox-id");
    expect(input[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    return (
      Promise.resolve()
        // Focus on input element
        .then(() => {
          input[0].dispatchEvent(new CustomEvent("focus"));
        })
        // Blur on input element to check error
        .then(() => {
          input[0].dispatchEvent(new CustomEvent("blur"));
        })
        // Verify not required and focus on input element again
        .then(() => {
          expect(element.shadowRoot.firstChild.className).not.toContain(
            "slds-has-error"
          );
          input[0].dispatchEvent(new CustomEvent("focus"));
        })
        // List should not appear on focus without any input
        .then(() => {
          expect(input[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
        })
        // Give minimal user input
        .then(() => {
          input[0].value = "a";
          input[0].dispatchEvent(new CustomEvent("input"));
        })
        // List should not appear with input[0].value.length < 2
        .then(() => {
          expect(input[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
        })
    );
  });

  it("Successful return with input length greater than 2", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = require("./data/mockComboboxMap.json");
    document.body.appendChild(element);

    getResults
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(MOCK_GET_RESULTS_SUCCESS[0]);
    JSON.parse = jest
      .fn()
      .mockImplementationOnce(() => {
        return [];
      })
      .mockImplementationOnce(() => {
        return MOCK_GET_RESULTS_SUCCESS[0];
      });
    const jsonParse = jest.spyOn(JSON, "parse");

    // Validate input field and closed results list
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");
    expect(input[0].ariaControls).toContain("pf-search-results-listbox-id");
    expect(input[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    return (
      Promise.resolve()
        // Give user input for no results
        .then(() => {
          input[0].value = "no results search";
          input[0].dispatchEvent(new CustomEvent("input"));
        })
        // Method should be called with these parameters
        .then(() => {
          expect(getResults).toHaveBeenLastCalledWith({
            inputQuery: input[0].value,
            objectApiName: element.comboboxMap[0].result.objectApiName,
            jsonFieldsToSearchFor: JSON.stringify({
              optionLabelApiName:
                element.comboboxMap[0].result.optionLabelApiName,
              optionCommentApiName:
                element.comboboxMap[0].result.optionCommentApiName,
              conditions: element.comboboxMap[0].result.conditions,
              excludeIds: []
            })
          });
          expect(getResults).toHaveBeenCalledTimes(1);
        })
        // Test no results
        .finally(() => {
          expect(jsonParse).toHaveBeenLastCalledWith([]);
        })
        // Give user input and expect results
        .then(() => {
          input[0].value = "sting";
          input[0].dispatchEvent(new CustomEvent("input"));
        })
        // Method should be called for User search
        .then(() => {
          expect(getResults).toHaveBeenLastCalledWith({
            inputQuery: input[0].value,
            objectApiName: element.comboboxMap[0].result.objectApiName,
            jsonFieldsToSearchFor: JSON.stringify({
              optionLabelApiName:
                element.comboboxMap[0].result.optionLabelApiName,
              optionCommentApiName:
                element.comboboxMap[0].result.optionCommentApiName,
              conditions: element.comboboxMap[0].result.conditions,
              excludeIds: []
            })
          });
          expect(getResults).toHaveBeenCalledTimes(2);
        })
        // Test the mocked successful result
        .finally(() => {
          expect(jsonParse).toHaveBeenLastCalledWith(
            MOCK_GET_RESULTS_SUCCESS[0]
          );
        })
        // Listbox appears after finally with correct results
        .then(() => {
          expect(input[0].parentElement.parentElement.className).toContain(
            "slds-is-open"
          );

          const resultsList = element.shadowRoot
            .querySelector('[id*="pf-search-results-listbox-id"]')
            .getElementsByTagName("li");

          expect(resultsList.length).toBe(MOCK_GET_RESULTS_SUCCESS[0].length);
        })
        // Click anywhere
        .then(() => {
          document.dispatchEvent(new CustomEvent("click"));
        })
        // Listbox closes
        .then(() => {
          expect(input[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
        })
    );
  });

  it("Error return with input length 2", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = require("./data/mockComboboxMap.json");
    document.body.appendChild(element);

    getResults.mockRejectedValue(MOCK_GET_RESULTS_ERROR);
    JSON.parse = jest.fn().mockImplementationOnce(() => {
      return MOCK_GET_RESULTS_ERROR.body.message;
    });
    const jsonParse = jest.spyOn(JSON, "parse");

    // Validate input field and closed results list
    const input = element.shadowRoot.querySelectorAll("input");
    expect(input.length).toBe(1);
    expect(input[0].id).toContain("pf-text-input-id");
    expect(input[0].ariaControls).toContain("pf-search-results-listbox-id");
    expect(input[0].parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    return (
      Promise.resolve()
        // Give user input with length 2
        .then(() => {
          input[0].value = "aa";
          input[0].dispatchEvent(new CustomEvent("input"));
        })
        // Method should be called once with these parameters
        .then(() => {
          expect(getResults).toHaveBeenLastCalledWith({
            inputQuery: input[0].value,
            objectApiName: element.comboboxMap[0].result.objectApiName,
            jsonFieldsToSearchFor: JSON.stringify({
              optionLabelApiName:
                element.comboboxMap[0].result.optionLabelApiName,
              optionCommentApiName:
                element.comboboxMap[0].result.optionCommentApiName,
              conditions: element.comboboxMap[0].result.conditions,
              excludeIds: []
            })
          });
          expect(getResults).toHaveBeenCalledTimes(1);
        })
        // Test the mocked error
        .finally(() => {
          expect(jsonParse).toHaveBeenLastCalledWith(
            MOCK_GET_RESULTS_ERROR.body.message
          );
        })
        // Listbox appears after finally with correct error message
        .then(() => {
          expect(input[0].parentElement.parentElement.className).toContain(
            "slds-is-open"
          );

          const resultsList = element.shadowRoot
            .querySelector('[id*="pf-search-results-listbox-id"]')
            .getElementsByTagName("li");

          expect(resultsList.length).toBe(1);
          expect(resultsList[0].textContent).toBe(
            MOCK_GET_RESULTS_ERROR.body.message.details
          );
        })
        // Click anywhere
        .then(() => {
          document.dispatchEvent(new CustomEvent("click"));
        })
        // Listbox closes
        .then(() => {
          expect(input[0].parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );
        })
    );
  });
});

describe("Selected Items List", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.resetAllMocks();
  });

  it("Add/Remove values to/from the list", () => {
    const element = createElement("c-polymorphic-field", {
      is: PolymorphicField
    });
    element.comboboxMap = MOCK_COMBOBOX_MAP;
    document.body.appendChild(element);

    getResults
      .mockResolvedValueOnce(MOCK_GET_RESULTS_SUCCESS[0])
      .mockResolvedValueOnce(MOCK_GET_RESULTS_SUCCESS[1]);
    JSON.parse = jest
      .fn()
      .mockImplementationOnce(() => {
        return MOCK_GET_RESULTS_SUCCESS[0];
      })
      .mockImplementationOnce(() => {
        return MOCK_GET_RESULTS_SUCCESS[1];
      });
    const jsonParse = jest.spyOn(JSON, "parse");

    // Get combobox
    const combobox = element.shadowRoot.querySelector(
      '[id*="pf-objectswitcher-combobox-id"]'
    );
    expect(combobox).not.toBeNull();
    expect(combobox.textContent).toBe(element.comboboxMap[0].option.label);
    expect(combobox.parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    // Get input field
    const input = element.shadowRoot.querySelector('[id*="pf-text-input-id"]');
    expect(input).not.toBeNull();
    expect(input.parentElement.parentElement.className).not.toContain(
      "slds-is-open"
    );

    return (
      Promise.resolve()
        // Give user input and expect results
        .then(() => {
          input.value = "sting";
          input.dispatchEvent(new CustomEvent("input"));
        })
        // Method should be called for User search
        .then(() => {
          expect(getResults).toHaveBeenLastCalledWith({
            inputQuery: input.value,
            objectApiName: element.comboboxMap[0].result.objectApiName,
            jsonFieldsToSearchFor: JSON.stringify({
              optionLabelApiName:
                element.comboboxMap[0].result.optionLabelApiName,
              optionCommentApiName:
                element.comboboxMap[0].result.optionCommentApiName,
              conditions: element.comboboxMap[0].result.conditions,
              excludeIds: []
            })
          });
          expect(getResults).toHaveBeenCalledTimes(1);
        })
        // Test the mocked successful result
        .finally(() => {
          expect(jsonParse).toHaveBeenLastCalledWith(
            MOCK_GET_RESULTS_SUCCESS[0]
          );
        })
        // Listbox appears with correct results
        .then(() => {
          expect(input.parentElement.parentElement.className).toContain(
            "slds-is-open"
          );

          const resultsList = element.shadowRoot
            .querySelector('[id*="pf-search-results-listbox-id"]')
            .getElementsByTagName("li");

          // 2 results according to mock
          expect(resultsList.length).toBe(MOCK_GET_RESULTS_SUCCESS[0].length);

          resultsList[0].dispatchEvent(new CustomEvent("click"));
        })
        // Listbox closes, input value becomes empty string and one item added to list
        .then(() => {
          expect(input.value).toBe("");
          expect(input.parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );

          // Check selected values sent to parent
          expect(element.selectedValues.length).toBe(1);
          expect(element.selectedValues[0].id).toBe(
            MOCK_GET_RESULTS_SUCCESS[0][0].Id
          );

          // Check UI selected values list
          const selectedList = element.shadowRoot
            .querySelector('[id*="pf-selected-values-list-id"]')
            .getElementsByTagName("li");
          expect(selectedList.length).toBe(1);
        })
        // Click on combobox
        .then(() => {
          combobox.dispatchEvent(new CustomEvent("click"));
        })
        // Check if list is open and select an item
        .then(() => {
          expect(combobox.parentElement.parentElement.className).toContain(
            "slds-is-open"
          );

          const listbox = element.shadowRoot
            .querySelector('[id*="pf-objectswitcher-listbox-id"]')
            .getElementsByTagName("li");

          // Should be 3 according to mock
          expect(listbox.length).toBe(element.comboboxMap.length);

          listbox[1].dispatchEvent(new CustomEvent("click"));
        })
        // Check if object changed and focus on input element with same input value
        .then(() => {
          expect(combobox.textContent).toBe(
            element.comboboxMap[1].option.label
          );

          input.dispatchEvent(new CustomEvent("focus"));
          input.value = "sting";
          input.dispatchEvent(new CustomEvent("input"));
        })
        // Method should be called for Group search
        .then(() => {
          expect(getResults).toHaveBeenLastCalledWith({
            inputQuery: input.value,
            objectApiName: element.comboboxMap[1].result.objectApiName,
            jsonFieldsToSearchFor: JSON.stringify({
              optionLabelApiName:
                element.comboboxMap[1].result.optionLabelApiName,
              optionCommentApiName:
                element.comboboxMap[1].result.optionCommentApiName,
              conditions: element.comboboxMap[1].result.conditions,
              excludeIds: [element.selectedValues[0].id]
            })
          });
          expect(getResults).toHaveBeenCalledTimes(2);
        })
        // Test the mocked successful result
        .finally(() => {
          expect(jsonParse).toHaveBeenLastCalledWith(
            MOCK_GET_RESULTS_SUCCESS[1]
          );
        })
        // Listbox appears with correct results
        .then(() => {
          expect(input.parentElement.parentElement.className).toContain(
            "slds-is-open"
          );

          const resultsList = element.shadowRoot
            .querySelector('[id*="pf-search-results-listbox-id"]')
            .getElementsByTagName("li");

          // 1 result according to mock
          expect(resultsList.length).toBe(MOCK_GET_RESULTS_SUCCESS[1].length);

          resultsList[0].dispatchEvent(new CustomEvent("click"));
        })
        // Listbox closes, input value becomes empty string and two items exist in list
        .then(() => {
          expect(input.value).toBe("");
          expect(input.parentElement.parentElement.className).not.toContain(
            "slds-is-open"
          );

          // Check selected values sent to parent
          expect(element.selectedValues.length).toBe(2);
          expect(element.selectedValues[1].id).toBe(
            MOCK_GET_RESULTS_SUCCESS[1][0].Id
          );

          // Check UI selected values list
          const selectedList = element.shadowRoot
            .querySelector('[id*="pf-selected-values-list-id"]')
            .getElementsByTagName("li");
          expect(selectedList.length).toBe(2);

          const removeItem = selectedList[1].querySelector(
            '[class*="slds-pill__remove"]'
          );
          expect(removeItem).not.toBeNull();
          removeItem.dispatchEvent(new CustomEvent("click"));
        })
        // One item is removed from list, only first
        .then(() => {
          // Check selected values sent to parent
          expect(element.selectedValues.length).toBe(1);
          expect(element.selectedValues[0].id).toBe(
            MOCK_GET_RESULTS_SUCCESS[0][0].Id
          );

          // Check UI selected values list
          const selectedList = element.shadowRoot
            .querySelector('[id*="pf-selected-values-list-id"]')
            .getElementsByTagName("li");
          expect(selectedList.length).toBe(1);
        })
    );
  });
});
