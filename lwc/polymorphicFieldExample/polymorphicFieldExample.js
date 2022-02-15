import { LightningElement } from "lwc";
import { getMapData } from "./utilities";

export default class PolymorphicFieldExample extends LightningElement {
  selectedValues;
  comboboxMap = getMapData();

  handleInputChange(event) {
    this.selectedValues = event.detail.value;
    this.selectedValues.forEach((element) => {
      console.log(element.id + ", " + element.objectApiName);
    });
  }
}
