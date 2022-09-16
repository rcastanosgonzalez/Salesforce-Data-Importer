import { LightningElement, api } from 'lwc';

export default class File extends LightningElement
{
    //#region Attributes
    @api fileName;
    variant = "";

    //#endregion Attributes

    //#region Methods
    preview()
    {
        this.dispatchEvent(new CustomEvent('preview'));
    }

    deleteFile()
    {
        this.dispatchEvent(new CustomEvent('delete'));
    }

    changeVariantToError()
    {
        this.variant = "error";
    }
    changeVariantToNormal()
    {
        this.variant = "";
    }

    //#endregion Attributes
}