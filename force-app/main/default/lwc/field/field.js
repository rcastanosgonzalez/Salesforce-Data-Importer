import { LightningElement, api } from 'lwc';

export default class Field extends LightningElement
{
    //#region Attributes
    @api label;
    @api name;
    @api variant = 'base';
    @api remove = false;

    @api index;
    @api value;

    //#endregion Attributes


    //#region Getters
    get getStyle()
    {
        let style = '';

        switch (this.variant)
        {
            case 'gray':
                style = 'background-color: rgb(221, 219, 218); color: black;'; 
                break;

            case 'success':
                style = 'background-color: rgb(75, 202, 129); color: white;'; 
                break;

            case 'empty':
                style = 'text-decoration: none;display: inline-flex;align-items: center;min-height: 1.625rem;padding: 0.125rem calc(1.25rem + 2px) 0.125rem 0.125rem;'; 
                break;
        
            default:
                break;
        }

        return style;
    }

    get getClassDrop()
    {
        let classReturn = '';

        switch (this.variant)
        {
            case 'empty':
                classReturn = 'slds-file-selector__dropzone'; 
                break;
        
            default:
                classReturn = 'slds-pill slds-pill_link';
                break;
        }

        return classReturn;
    }

    get getClassPill()
    {
        let classReturn = '';

        switch (this.variant)
        {
            case 'empty':
                classReturn = ''; 
                break;

            default:
                classReturn = 'slds-pill__action';
                break;
        }

        return classReturn;
    }

    get isRemovableField()
    {
        return this.remove && this.value;
    }

    //#endregion Getters
    
    //#region Methods
    removeValue()
    {
        this.dispatchEvent(new CustomEvent('remove'));
    }

    //#endregion Methods
}