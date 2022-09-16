import { LightningElement, api } from 'lwc';

export default class FileUploadButton extends LightningElement
{
  //#region Attributes
  @api label;
  @api acceptedFormats;

  //#endregion Attributes

  //#region Methods
  handleFile(event)
  {
      var event = new CustomEvent('fileupload', {
          detail: {
            file: event.target.files[0]
          }
        })
      
      this.dispatchEvent(event);
  }

  //#endregion Methods
}