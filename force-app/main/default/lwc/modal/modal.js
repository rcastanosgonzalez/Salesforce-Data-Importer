import { LightningElement, api } from 'lwc';

export default class Modal extends LightningElement 
{
    //#region Attributes
    @api title;
    @api tagline;
    @api message;
    @api isHtml;
    @api showConfirmButton;

    //#endregion Attributes

    //#region Methods
    handleCancelClick()
    {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleOkClick()
    {
        this.dispatchEvent(new CustomEvent('confirm'));
    }
    //#endregion Methods
}