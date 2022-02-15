import { api, LightningElement } from "lwc";
import getResults from "@salesforce/apex/PolymorphicFieldHandler.getResults";

const LIST_RESULTS_CLASSES_OPEN =
  "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open";
const LIST_RESULTS_CLASSES_CLOSE =
  "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click";

const CLASSES_FOR_VALID_INPUT = "slds-form-element";
const CLASSES_FOR_INVALID_INPUT = "slds-form-element slds-has-error";

/**
 * @author        Andreas Tsimpanogiannis
 * @since         02/Feb/2022
 * @version       1.0
 * @description   A component that mimics a polymorphic lookup relationship.
 */
export default class PolymorphicField extends LightningElement {
  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                               Public members                                 //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @public
   * @type        {String}
   * @description The label of the field. It appears on the top left of the component.
   */
  @api label;
  /**
   * @public
   * @type        {Array<Object>}
   * @description Contains information about the Object categories and the results.
   *
   * @example
   * comboboxMap: [
   *    option: {                           // Option sub-object is used in the UI
   *       id: "exampleId",                 // To be used inside <li> elements
   *       label: "Users",                  // The label for the specific object
   *       icon: "standard:user"            // The icon for the specific object (not mandatory)
   *    },
   *    result: {                           // Result sub-object is used in the Apex query
   *       objectApiName: "User",           // Api name of the object
   *       optionLabelApiName: "Name",      // Api name of the main field we are querying
   *       optionCommentApiName: "Email",   // Api name of an additional field (not mandatory)
   *       conditions: ["IsActive = TRUE"]  // A list of conditions to be used in a WHERE statement.
   *    }                                   // Statements are connected with AND. (not mandatory)
   * ]
   */
  @api comboboxMap;
  /**
   * @private
   * @type        {String}
   * @description Help text that appears in the input field when there is no value.
   */
  @api placeholder;
  /**
   * @public
   * @type        {Array<Object>}
   * @description An array of selected values. Each value contains information about the selected item.
   *
   * @example
   * selectedValues: [
   *    {
   *       id: "recordId",                  // The record Id of the selected object
   *       objectApiName: "User",           // The api name of the selected object
   *    }
   * ]
   */
  @api selectedValues;
  /**
   * @public
   * @type        {Boolean}
   * @description When true, a magnifying glass appears on the right of the component.
   */
  @api hasSearchIcon;
  /**
   * @public
   * @type        {Boolean}
   * @description When true, the component has a red star next to the label and appears
   *              red when there is no value present.
   */
  @api required;
  /**
   * @public
   * @type        {String}
   * @description When the component is required and there is an error, this message
   *              appears at the bottom.
   */
  @api requiredMessage;
  /**
   * @public
   * @type        {Boolean}
   * @description When true, the component has a help icon.
   */
  @api withHelp;
  /**
   * @public
   * @type        {String}
   * @description When the component's help icon gets clicked, this message
   *              appears inside a help bubble.
   */
  @api helpMessage;

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                              Private members                                 //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @public
   * @type        {Object}
   * @description The selected option from the comboboxMap.
   */
  selectedObject;
  /**
   * @private
   * @type        {String}
   * @description The value the user types in the input field
   */
  value = "";
  /**
   * @private
   * @type        {Boolean}
   * @description Shows when there is an error. Assign to empty string on load.
   *              We don't want the error to appear on load.
   */
  hasError = false;
  /**
   * @private
   * @type        {String}
   * @description The classes for the top level component. Swap between CLASSES_FOR_VALID_INPUT
   *              and CLASSES_FOR_INVALID_INPUT, depending on whether there is an error on not.
   */
  topLevelClasses;
  /**
   * @private
   * @type        {String}
   * @description The classes for the combobox options. Swap between LIST_RESULTS_CLASSES_OPEN
   *              and LIST_RESULTS_CLASSES_CLOSE, depending on whether the combobox was clicked.
   */
  comboboxClasses;
  /**
   * @private
   * @type        {String}
   * @description The classes for the search results. Swap between LIST_RESULTS_CLASSES_OPEN
   *              and LIST_RESULTS_CLASSES_CLOSE, depending on whether the user has searched
   *              for something or not.
   */
  resultsClasses;
  /**
   * @private
   * @type        {Boolean}
   * @description Is true when the user clicks the input area, is false otherwise.
   */
  inputHasFocus = false;
  /**
   * @private
   * @type        {Boolean}
   * @description Is true when loading data from Apex, is false otherwise.
   */
  isLoading = false;
  /**
   * @private
   * @type        {Boolean}
   * @description Is true when the user has clicked the help icon, is false otherwise.
   */
  helpClicked = false;
  /**
   * @private
   * @type        {Array<Object>}
   * @description An array of selected values to be used internally.
   *
   * @example
   * selectedValuesInternal: [
   *    {
   *       id: "recordId",                  // The record Id of the selected object
   *       objectApiName: "User",           // The api name of the selected object
   *       value: "Dummy Dummyson",         // The main field that we queried
   *       icon: "standard:user"            // The icon for the specific object, used in the UI (not mandatory)
   *    }
   * ]
   */
  selectedValuesInternal = [];
  /**
   * @private
   * @type        {Array<String>}
   * @description An array with all the current selected values' Ids.
   */
  selectedValuesIds = [];
  /**
   * @private
   * @type        {Array<Object>}
   * @description An array with the current search results.
   *
   * @example
   * results: [
   *    {
   *       id: "recordId",                  // The record Id of the selected object
   *       objectApiName: "User",           // The api name of the selected object
   *       value: "Dummy Dummyson",         // The main field that we queried
   *       icon: "standard:user"            // The icon for the specific object, used in the UI
   *       listValue: {                     // Let's say the user searches for "mmys"
   *          start: "Dummy Du",            // The first part of the string
   *          bold: "mmys",                 // The user search in bold
   *          end: "on"                     // The last part of the string
   *       }
   *    }
   * ]
   */
  results = [];
  /**
   * @private
   * @type        {String}
   * @description A message that appears inside the results list if there is an error with the query.
   */
  resultsErrorMessage = null;

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                                  Getters                                     //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @returns     {Boolean} True/false.
   * @description Checks if the results array is empty or not.
   */
  get hasResults() {
    if (
      this.results === undefined ||
      this.results === null ||
      this.results.length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * @returns     {Boolean} True/false.
   * @description Checks if the any value exists in the input field.
   */
  get hasValue() {
    if (
      this.value === undefined ||
      this.value === null ||
      this.value.length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * @returns     {Boolean} True/false.
   * @description Checks if the any values exist in the selectedValues array.
   */
  get hasSelectedValues() {
    if (
      this.selectedValues === undefined ||
      this.selectedValues === null ||
      this.selectedValues.length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                          Default LWC Callbacks                               //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  connectedCallback() {
    this.selectedValues = [];
    this.topLevelClasses = CLASSES_FOR_VALID_INPUT;
    this.comboboxClasses = LIST_RESULTS_CLASSES_CLOSE;
    this.resultsClasses = LIST_RESULTS_CLASSES_CLOSE;

    if (this.comboboxMap) {
      this.selectedObject = this.comboboxMap[0];
    }

    // An event listener is added to handle closing the combobox options list
    // and the results list.
    document.addEventListener("click", this.closeResultsList);
  }

  disconnectedCallback() {
    // Removing the listener.
    document.removeEventListener("click", this.closeResultsList);
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                              Event Handling                                  //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description This method is used to ignore click events on the combobox options
   *              list and the results list. We want the event listener to handle closing those lists
   *              except when clicking on the lists themselves.
   */
  ignoreClick(event) {
    event.stopPropagation();
  }
  /**
   * @returns     {void}
   * @description The arrow method that gets called to close those lists.
   */
  closeResultsList = () => {
    if (this.comboboxClasses === LIST_RESULTS_CLASSES_OPEN) {
      this.comboboxClasses = LIST_RESULTS_CLASSES_CLOSE;
    }
    if (
      this.resultsClasses === LIST_RESULTS_CLASSES_OPEN &&
      !this.inputHasFocus
    ) {
      this.resultsClasses = LIST_RESULTS_CLASSES_CLOSE;
    }
  };

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                              Combobox Handlers                               //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks on the combobox. Opens the combobox
   *              options list.
   */
  handleComboboxClick(event) {
    event.stopPropagation();
    this.resultsClasses = LIST_RESULTS_CLASSES_CLOSE;
    this.comboboxClasses = LIST_RESULTS_CLASSES_OPEN;
  }

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks an option from the options list.
   */
  handleComboboxObjectChange(event) {
    this.selectedObject = this.comboboxMap.find(
      (item) => item.option.id === event.currentTarget.dataset.id
    );

    this.comboboxClasses = LIST_RESULTS_CLASSES_CLOSE;
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                              Input Handlers                                  //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user types inside the input field.
   */
  handleInput(event) {
    this.value = event.target.value;

    if (this.hasError) {
      this.checkForError();
    }
    this.loadData();
  }

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks inside the input field.
   */
  handleInputFocus(event) {
    this.inputHasFocus = true;
    this.loadData();
  }

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks ourside the input field.
   */
  handleInputBlur(event) {
    this.inputHasFocus = false;
    this.isLoading = false;
    this.checkForError();
  }

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user selects an item from the list
   *              of the returned results. Notifies with an "inputchange" event
   *              and passes the data to the parent component.
   */
  handleResultsSelectedItem(event) {
    const valueId = event.currentTarget.dataset.id;

    const result = this.results.find((o) => o.id === valueId);

    // Values returned to parent
    this.selectedValues.push({
      id: result.id,
      objectApiName: result.objectApiName
    });
    this.dispatchEvent(
      new CustomEvent("inputchange", {
        detail: {
          value: this.selectedValues
        }
      })
    );

    // Store additional values for the UI
    this.selectedValuesInternal.push({
      id: result.id,
      objectApiName: result.objectApiName,
      value: result.value,
      icon: this.selectedObject.option.icon
    });

    // Store IDs separately
    this.selectedValuesIds.push(result.id);

    this.value = "";

    this.resultsClasses = LIST_RESULTS_CLASSES_CLOSE;
    this.isLoading = false;
    this.checkForError();
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                              Help Handlers                                   //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks the help button.
   */
  handleHelpClick(event) {
    if (this.helpMessage) {
      this.helpClicked = true;
    } else {
      this.helpClicked = false;
    }
  }

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the help button has lost focus.
   */
  handleHelpBlur(event) {
    this.helpClicked = false;
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                          Selected Items List                                 //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @param       {Event} event
   * @returns     {void}
   * @description Gets called when the user clicks the "x" button on the right
   *              of a selected item.
   */
  removeSelectedItem(event) {
    this.selectedValues = this.selectedValues.filter(
      (item) => item.id !== event.currentTarget.dataset.id
    );
    this.selectedValuesInternal = this.selectedValuesInternal.filter(
      (item) => item.id !== event.currentTarget.dataset.id
    );
    this.selectedValuesIds = this.selectedValuesIds.filter(
      (id) => id !== event.currentTarget.dataset.id
    );

    this.dispatchEvent(
      new CustomEvent("inputchange", {
        detail: {
          value: this.selectedValues
        }
      })
    );

    this.checkForError();
  }

  //////////////////////////////////////////////////////////////////////////////////
  //                                                                              //
  //                            Additional methods                                //
  //                                                                              //
  //////////////////////////////////////////////////////////////////////////////////

  /**
   * @returns     {void}
   * @description Loads the data from the backend.
   */
  loadData() {
    // Empty the array before loading new data.
    this.results = [];
    // Nullify error.
    this.resultsErrorMessage = null;

    if (this.value !== null) {
      // At least 2 characters before starting search.
      if (this.value.length > 1) {
        this.isLoading = true;

        getResults({
          inputQuery: this.value,
          objectApiName: this.selectedObject.result.objectApiName,
          jsonFieldsToSearchFor: JSON.stringify({
            optionLabelApiName: this.selectedObject.result.optionLabelApiName,
            optionCommentApiName:
              this.selectedObject.result.optionCommentApiName,
            conditions: this.selectedObject.result.conditions,
            excludeIds: this.selectedValuesIds
          })
        })
          .then((result) => {
            const parsedResult = JSON.parse(result);

            // Populate the results array.
            for (const result of parsedResult) {
              // Splitting the result into three strings.
              // The value that the user has searched for (middle) will show in bold.
              // Ignore capital letters.
              const firstSplit = result[
                this.selectedObject.result.optionLabelApiName
              ]
                .toLowerCase()
                .indexOf(this.value.toLowerCase());
              const secondSplit = firstSplit + this.value.length;
              const end =
                result[this.selectedObject.result.optionLabelApiName].length;

              // Store the data.
              const data = {
                id: result.Id,
                objectApiName: this.selectedObject.result.objectApiName,
                value: result[this.selectedObject.result.optionLabelApiName],
                meta: result[this.selectedObject.result.optionCommentApiName],
                listValue: {
                  start: result[
                    this.selectedObject.result.optionLabelApiName
                  ].substring(0, firstSplit),
                  bold: result[
                    this.selectedObject.result.optionLabelApiName
                  ].substring(firstSplit, secondSplit),
                  end: result[
                    this.selectedObject.result.optionLabelApiName
                  ].substring(secondSplit, end)
                }
              };

              // Populate the array.
              this.results.push(data);
            }

            if (!this.hasResults) {
              this.resultsErrorMessage = "No Records Found";
            }
          })
          .catch((error) => {
            const parsedError = JSON.parse(error.body.message);
            console.log(parsedError);

            this.resultsErrorMessage = parsedError.details;
          })
          .finally(() => {
            // Stop loading and open the results list.
            this.isLoading = false;
            this.resultsClasses = LIST_RESULTS_CLASSES_OPEN;
          });

        return;
      }
    }

    // Close the results lists if no input or too small input.
    this.isLoading = false;
    this.resultsClasses = LIST_RESULTS_CLASSES_CLOSE;
  }

  /**
   * @returns     {Boolean} True/false
   * @description Checks if there has been an error.
   */
  checkForError() {
    if (this.required) {
      if (this.hasSelectedValues || this.hasValue) {
        this.hasError = false;
        this.topLevelClasses = CLASSES_FOR_VALID_INPUT;
      } else {
        this.hasError = true;
        this.topLevelClasses = CLASSES_FOR_INVALID_INPUT;
      }
    } else {
      this.hasError = false;
      this.topLevelClasses = CLASSES_FOR_VALID_INPUT;
    }
  }
}
