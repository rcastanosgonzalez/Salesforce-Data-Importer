//#region Imports
import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getSalesforceObjects from '@salesforce/apex/MetadataUtil.getSalesforceObjects';
import getSalesforceObjectFields from '@salesforce/apex/MetadataUtil.getObjectFields';
import importData from '@salesforce/apex/DataImporterService.importData';
import { loadScript } from 'lightning/platformResourceLoader';
import sheetJS from '@salesforce/resourceUrl/SheetJs';

//#endregion Imports

export default class DataImporter extends LightningElement
{
    //#region Constants
    BATCH_SIZE = 200;

    LOOK_FOR_DUPLICATES = 'Comprobar duplicados';

    //OPERATIONS
    INSERT = 'Insert';
    UPDATE = 'Update';
    UPSERT = 'Upsert';
    DELETE = 'Delete';

    //STATES
    CHOOSE_OPERATION = 'choose';
    INIT = 'init';
    LOAD_FILE = 'load file';
    MAPPING = 'mapping';
    CHOOSE_UPSERT_FIELD = 'upsert';
    IMPORT = 'importing';

    //VALID FORMATS
    ACCEPTED_FORMATS = ['.csv', '.xls', '.xlsx'];

    //PATHS
    PATH = [
        {label:'Seleccione un objeto', value:this.INIT},
        {label:'Cargue su archivo y previsualizelo', value:this.LOAD_FILE},
        {label:'Mapee los campos', value:this.MAPPING},
        {label:'Importar registros', value:this.IMPORT}
    ];

    UPSERT_PATH = [
        {label:'Seleccione un objeto', value:this.INIT},
        {label:'Cargue su archivo y previsualizelo', value:this.LOAD_FILE},
        {label:'Seleccione el campo por el cual realizar el upsert', value:this.CHOOSE_UPSERT_FIELD},
        {label:'Mapee los campos', value:this.MAPPING},
        {label:'Importar registros', value:this.IMPORT}
    ];

    //#endregion Constants

    //#region Attributes

    currentPath;
    currentState = this.CHOOSE_OPERATION;
    operation;

    loading = false;

    salesforceObjects;

    //Objects and fields
    objectPicked;
    objectPickedFields;
    upsertFieldPicked;
    
    //Uploaded file contents
    uploadedFile;
    workbook;
    dataSheets = [];
    dataSheetsWithHeader = [];

    //Data preview
    columns;
    data;
    keyField;

    //Mapping
    @track fieldsMapping;
    mappingFile;

    //Import
    jsonToImport;
    processedRecords = 0;
    stopImporting = false;
    draftMode = false;

    //Import response
    errors = [];
    success = [];

    //Modal attributes
    showModal = false;
    showConfirmButton = false;
    modalTitle;
    tagline;
    message;
    isHtml = false;

    //#endregion Attributes

    //#region Getters

    get title()
    {
        let response = 'Data importer - ';

        switch (this.currentState)
        {
            case this.CHOOSE_OPERATION:
                response += 'Seleccione qué operación desea realizar';
                break;

            case this.INIT:
                response += 'Seleccione una entidad';
                break;

            case this.LOAD_FILE:
                response += 'Seleccione un fichero con los datos a importar';
                break;

            case this.CHOOSE_UPSERT_FIELD:
                response += 'Seleccione el campo por el cual se realizará el upsert';
                break;

            case this.MAPPING:
                response += 'Relacione las columnas del fichero con los campos del objeto';
                break;

            case this.IMPORT:
                response += 'Importando los registros';
                break;
        
            default:
                break;
        }
        
        return response;
    }

    get isVisiblePath()
    {
        let isVisible = false;

        if(!this.isChoose)
        {
            isVisible = true;
        }

        return isVisible;
    }

    //#region states
    get isChoose()
    {
        return this.currentState == this.CHOOSE_OPERATION;
    }

    get isInit()
    {
        return this.currentState == this.INIT;
    }

    get isLoadFile()
    {
        return this.currentState == this.LOAD_FILE;
    }

    get isChooseUpsertField()
    {
        return this.currentState == this.CHOOSE_UPSERT_FIELD;
    }

    get isMapping()
    {
        return this.currentState == this.MAPPING;
    }

    get isImporting()
    {
        return this.currentState == this.IMPORT;
    }

    get isLoading()
    {
        return this.loading || (this.isLoadingSalesforceObjects && this.isInit);
    }
    //#endregion states

    //#region operation

    get isInsert()
    {
        return this.operation == this.INSERT;
    }

    get isUpdate()
    {
        return this.operation == this.UPDATE;
    }

    get isUpsert()
    {
        return this.operation == this.UPSERT;
    }

    get isDelete()
    {
        return this.operation == this.DELETE;
    }
    //#endregion operation
    
    //#region steps
    get nextStepLabel()
    {
        let label = 'Siguiente';

        if(this.isMapping && !this.isDelete)
        {
            label = 'Importar';
        }
        else if(this.isMapping && this.isDelete)
        {
            label = 'Borrar registros';
        }
        else if(this.isImporting)
        {
            label = 'Volver a empezar';
        }

        return label;
    }

    get isDisableNextStep()
    {
        let isDisable = false;

        if(this.isInit && this.objectPicked == null)
        {
            isDisable = true;
        }
        else if(this.isLoadFile && this.dataSheets.length == 0)
        {
            isDisable = true;
        }
        else if(this.isChooseUpsertField && !this.upsertFieldPicked)
        {
            isDisable = true;
        }
        else if(this.isMapping)
        {
            isDisable = true;

            for(var i=0; i < this.fieldsMapping.length && isDisable; i++)
            {
                if((this.fieldsMapping[i].value && (!this.isUpdate && !this.isUpsert)) || 
                    (this.isUpdate && this.fieldsMapping[i].value == 'Id') ||
                    (this.isUpsert && this.fieldsMapping[i].value == this.upsertFieldPicked))
                {
                    isDisable = false;
                }
            }
        }
        else if(this.isImporting && !this.stopImporting)
        {
            isDisable = true;
        }

        return isDisable;
    }

    get isVisiblePreviousStep()
    {
        let isVisible = true;

        if(this.isChoose || (this.isImporting && !this.stopImporting))
        {
            isVisible = false;
        }
        return isVisible;
    }

    get isVisibleNextStep()
    {
        let isVisible = true;

        if(this.isChoose)
        {
            isVisible = false;
        }
        return isVisible;
    }

    get nextStepVariant()
    {
        let variant = 'brand';

        if(this.isMapping)
        {
            variant = 'success';
        }

        return variant;
    }

    //#endregion steps
    
    
    get isFileUploaded()
    {
        return this.uploadedFile;
    }

    get showPreviewDataTable()
    {
        return this.isFileUploaded && (this.isLoadFile || this.isMapping);
    }

    get progress()
    {
        return (this.processedRecords/this.jsonToImport.length)*100;
    }

    get isError()
    {
        return this.errors.length > 0;
    }

    get isDisabledMappingDownload()
    {
        return !this.mappingFile;
    }

    get showError()
    {
        return this.isDisableNextStep && this.isMapping;
    }

    get getErrorMessage()
    {
        let message = 'Debe mapear por lo menos una columna';

        if(this.isUpdate || this.isDelete)
        {
            message = 'Debe mapear por lo menos el ID';
        }
        else if(this.isUpsert)
        {
            message = 'Debe mapear por lo menos la columna ' + this.upsertFieldPicked;
        }

        return message;
    }
    //#endregion Getters

    //#region Methods
    connectedCallback()
    {
        loadScript(this, sheetJS + '/xlsx.full.min.js');
    }

    handleChooseOperation(event)
    {
        this.operation = event.target.label;

        this.getObjects();

        switch (this.operation)
        {
            case this.INSERT:
                this.currentPath = this.PATH;
                this.currentState = this.INIT;
                break;

            case this.UPDATE:
                this.currentPath = this.PATH;
                this.currentState = this.INIT;
                break;

            case this.UPSERT:
                this.currentPath = this.UPSERT_PATH;
                this.currentState = this.INIT;
                break;

            case this.DELETE:
                this.currentPath = this.PATH;
                this.currentState = this.INIT;
                break;
        
            default:
                break;
        }
    }

    previousStep(event)
    {
        switch (this.currentState)
        {
            case this.INIT:
                this.currentState = this.CHOOSE_OPERATION;
                break;

            case this.LOAD_FILE:
                this.currentState = this.INIT;
                break;

            case this.CHOOSE_UPSERT_FIELD:
                this.currentState = this.LOAD_FILE;
                break;

            case this.MAPPING:
                if(this.isUpsert)
                {
                    this.currentState = this.CHOOSE_UPSERT_FIELD;
                }
                else
                {
                    this.currentState = this.LOAD_FILE;
                }
                
                break;

                case this.IMPORT:
                    this.errors = [];
                    this.success = [];
                    this.stopImporting = false;
                    this.processedRecords = 0;
                    this.currentState = this.MAPPING;
                    break;
        
            default:
                break;
        }
    }

    nextStep(event)
    {
        switch (this.currentState)
        {
            case this.INIT:
                this.getObjectFields();
                this.currentState = this.LOAD_FILE;
                break;

            case this.LOAD_FILE:
                if(this.isUpsert)
                {
                    this.currentState = this.CHOOSE_UPSERT_FIELD;
                }
                else
                {
                    this.currentState = this.MAPPING;
                }
                
                break;

            case this.CHOOSE_UPSERT_FIELD:
                this.currentState = this.MAPPING;
                break;

            case this.MAPPING:
                this.showConfirmationModal();
                break;

            case this.IMPORT:
                this.restart();
                break;
        
            default:
                break;
        }
    }

    setLoading(value)
    {
        this.loading = value;
    }

    setDraftMode()
    {
        this.draftMode = true;
        this.confirmModal();
    }

    //#region Object
    handleChangeUpsertField(event)
    {
        this.upsertFieldPicked = event.detail.value;
    }

    getObjects()
    {
        this.setLoading(true);

        getSalesforceObjects({operation: this.operation})
                .then(result => 
                { 
                    this.setLoading(false);
                    this.salesforceObjects = result;
                })
                .catch(error => 
                { 
                    this.setLoading(false);
                    this.currentState = this.INIT;
                    this.showToast('Error', 'Ha ocurrido un error inesperado a la hora de recuperar los objetos', 'error', 'dismissable'); 
                })
    }

    getObjectFields()
    {
        if(!this.isDelete)
        {
            getSalesforceObjectFields({objectType: this.objectPicked, operation: this.operation})
                .then(result => 
                { 
                    this.objectPickedFields = result;
                })
                .catch(error => 
                { 
                    this.currentState = this.INIT;
                    this.showToast('Error', 'Ha ocurrido un error inesperado a la hora de recuperar los campos del objeto', 'error', 'dismissable'); 
                })
        }
        else
        {
            this.objectPickedFields = [{label:'Id', value: 'Id'}];
        }
        
    }
    
    handleChangeObject(event)
    {
        this.objectPicked = event.detail.value;
        this.uploadedFile = null;
        this.fieldsMapping = null;
        this.upsertFieldPicked = null;
    }

    //#endregion Object

    //#region File

    handleUploadFinished(event)
    {
        if(this.checkFileExtension(event.detail.files[0]))
        {
            this.uploadedFile = event.detail.files[0];
            this.setLoading(true);

            var reader = new FileReader();
            var self = this;
            
            reader.onload = function (evt)
            {
                let data = evt.target.result;
                self.workbook = XLSX.read(data, {type: 'binary'});

                self.dataSheets = XLSX.utils.sheet_to_json(self.workbook.Sheets[self.workbook.SheetNames[0]], {raw:false});

                self.dataSheetsWithHeader = XLSX.utils.sheet_to_json(self.workbook.Sheets[self.workbook.SheetNames[0]], {raw:false, header:1});
                self.columns = [];
                self.fieldsMapping = [];

                let key = 0;

                self.dataSheetsWithHeader[0].forEach(function(name)
                {
                    //Generate datatable columns
                    let objectColumn = new Object();
                    objectColumn.label = name;
                    objectColumn.fieldName = name;
                    objectColumn.actions = [{ label: self.LOOK_FOR_DUPLICATES, iconName:'utility:search', checked: false, name: name}];

                    self.columns.push(objectColumn);

                    //Generate field mappings
                    let fieldMap = new Object();
                    fieldMap.label = 'Arrastre una columna aquí';
                    fieldMap.name = name;
                    fieldMap.variant = 'empty';
                    fieldMap.key = key;

                    self.fieldsMapping.push(fieldMap);

                    key++;
                });

                self.keyField = self.columns[0].label;
                self.data = self.dataSheets.slice(0,10);

                self.setLoading(false);
            };
            
            reader.readAsBinaryString(this.uploadedFile);
        }
    }

    deleteFile()
    {
        this.uploadedFile = null;
        this.workbook = null;
        this.dataSheets = [];
        this.keyField = null;
        this.columns = null;
        this.data = null;
        this.fieldsMapping = null;
    }

    checkFileExtension(file)
    {
        let isOk = true;
        let regex = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + this.ACCEPTED_FORMATS.join('|') + ")$");

        if (!regex.test(file.name.toLowerCase()))
        {
            this.showToast('Error', 'El archivo debe tener la extensión XLSX o CSV', 'warning', 'dismissable');
            return false;
        }

        return isOk;
    }

    handleHeaderAction(event)
    {
        const actionName = event.detail.action.name;
        const actionLabel = event.detail.action.label;

        if(actionLabel == this.LOOK_FOR_DUPLICATES)
        {
            this.checkDuplicates(actionName);
        }
    }

    checkDuplicates(columnName)
    {
        var values = {};
        var result = '';

        this.dataSheets.forEach(function (record)
        {
            if(!values[record[columnName]])
            {
                let newValue = new Object();
                newValue.rowNumber = record.__rowNum__ + '';
                values[record[columnName]] = newValue;
            }
            else
            {
                values[record[columnName]].rowNumber = values[record[columnName]].rowNumber + ', ' + record.__rowNum__;
            }
        })

        for (var prop in values)
        {
           if(values[prop].rowNumber.includes(","))
           {
               result += 'En las líneas <strong>'+ values[prop].rowNumber + '</strong> está duplicado el valor: <strong>' + prop + '</strong><br>';
           }

        }

        if(result)
        {
            this.showConfirmButton = false;
            this.message = result;
            this.isHtml = true;
            this.modalTitle = 'Se han encontrado duplicados';
            this.showModal = true;
        }
        else
        {
            this.showToast('No hay duplicados', 'No se ha encontrado ningún duplicado en la columna ' + columnName, 'success', 'dismissable');
        }

    }

    //#endregion File


    //#region Mapping
    handleDragStart(event)
    {
        event.dataTransfer.setData("value", event.target.value);
        event.dataTransfer.setData("index", event.target.index);
        event.dataTransfer.setData("variant", event.target.variant);
        event.dataTransfer.setData("label", event.target.label);
    }

    handleDrop(event)
    {
        event.preventDefault();
        
        //Recogemos los datos del campo que se arrastra
        let indexFrom = event.dataTransfer.getData("index");
        let valueFrom = event.dataTransfer.getData("value");
        let variantFrom = event.dataTransfer.getData("variant");
        let labelFrom = event.dataTransfer.getData("label");

        //Recogemos los datos del campo en el que se suelta
        let indexTo = event.target.index;
        let valueTo = this.fieldsMapping[indexTo].value;
        let variantTo = this.fieldsMapping[indexTo].variant;
        let labelTo = this.fieldsMapping[indexTo].label;

        //Si tiene informado el index, significa que el campo viene desde la columna del mapeo.
        //Por lo tanto, hay que intercambiar los campos de posición
        if(indexFrom != null && indexFrom != 'undefined' && indexFrom != 'null')
        {

            this.fieldsMapping[indexFrom].label = labelTo;
            this.fieldsMapping[indexFrom].value = valueTo;
            this.fieldsMapping[indexFrom].variant = variantTo;

            this.fieldsMapping[indexTo].label = labelFrom;
            this.fieldsMapping[indexTo].variant = variantFrom;

            //Controlamos que se mueva un campo vacío a uno que no lo está
            if(valueFrom != null && valueFrom != 'undefined' && valueFrom != 'null')
            {
                this.fieldsMapping[indexTo].value = valueFrom;
            }
            else
            {
                this.fieldsMapping[indexTo].value = null;
            }
        }
        //Si no tiene informado el index pero sí el valor, significa que viene desde la columna de campos del objeto
        else if(valueFrom != null && valueFrom != 'undefined' && valueFrom != 'null')
        {
            //Se controla que cada columna solo se pueda mapear una vez
            let isSet = false;
            this.fieldsMapping.forEach(function(fieldMapping)
            {
                if(fieldMapping.value == valueFrom)
                {
                    isSet = true;
                }
            });

            if(!isSet)
            {
                this.fieldsMapping[indexTo].label = valueFrom;
                this.fieldsMapping[indexTo].value = valueFrom;
                this.fieldsMapping[indexTo].variant = 'success';
            }
            
        }

        this.generateMappingFile();
        
    }

    handleDragOver(event)
    {
        event.preventDefault();
    }

    removeFieldMapping(event)
    {
        let index = event.target.index;
        this.fieldsMapping[index].label = 'Arrastre una columna aquí';
        this.fieldsMapping[index].value = null;
        this.fieldsMapping[index].variant = 'empty';

        this.generateMappingFile();
    }

    removeAllFieldMappings()
    {
        this.fieldsMapping.forEach(function(fieldMapping)
        {
            fieldMapping.label = 'Arrastre una columna aquí';
            fieldMapping.value = null;
            fieldMapping.variant = 'empty';
        });

        this.generateMappingFile();
    }

    automaticMapping()
    {
        for(var i=0; i < this.columns.length; i++)
        {
            for(var j=0; j < this.objectPickedFields.length; j++)
            {
                if(this.columns[i].fieldName.toLowerCase() == this.objectPickedFields[j].value.toLowerCase())
                {
                    this.fieldsMapping[i].label = this.objectPickedFields[j].value;
                    this.fieldsMapping[i].value = this.objectPickedFields[j].value;
                    this.fieldsMapping[i].variant = 'success';
                }
            }
        }

        this.generateMappingFile();
    }

    generateMappingFile()
    {
        let result = '';

        this.fieldsMapping.forEach(function(fieldMapping)
        {
            if(fieldMapping.value)
            {
                result += fieldMapping.name + '=' + fieldMapping.value + '\n';
            }
        });

        if(result)
        {
            result = result.slice(0, -1);
            this.mappingFile = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result);
        }
        else
        {
            this.mappingFile = null;
        }
        
    }

    downloadMapping()
    {
        this.template.querySelector('.downloadLink').click();
    }

    handleMappingUpload(event)
    {
        this.removeAllFieldMappings();

        var reader = new FileReader();
        var self = this;

        reader.onload = function(progressEvent)
        {
            let lines = this.result.split('\n');

            lines.forEach(function(line)
            {
                if(line && !line.startsWith('#'))
                {
                    let found = false;

                    let fields = line.split('=');

                    for(let i=0; i < self.fieldsMapping.length && !found; i++)
                    {
                        if(self.fieldsMapping[i].name == fields[0])
                        {
                            self.fieldsMapping[i].label = fields[1];
                            self.fieldsMapping[i].value = fields[1];
                            self.fieldsMapping[i].variant = 'success';
                        }
                    }
                    
                }
                
            });

            self.generateMappingFile();
        };

        reader.readAsText(event.detail.file);
    }

    //#endregion Mapping

    //#region Import
    cancelImport()
    {
        this.stopImporting = true;
    }

    finishImport(json)
    {
        importData({jsonEntry: JSON.stringify(json), objectType: this.objectPicked, operationType: this.operation, upsertField: this.upsertFieldPicked, currentRecord: this.processedRecords+2, draftMode: this.draftMode})
            .then(result => { 

                this.processedRecords += this.BATCH_SIZE;

                if(result)
                {
                    this.errors = this.errors.concat(result['errors']);
                    this.success = this.success.concat(result['success']);
                }

                if(this.processedRecords < this.jsonToImport.length && !this.stopImporting)
                {
                    this.finishImport(this.jsonToImport.slice(this.processedRecords, this.processedRecords + this.BATCH_SIZE));
                }
                else
                {
                    if(!this.stopImporting)
                    {
                        this.processedRecords = this.jsonToImport.length;
                    }
                    
                    this.stopImporting = true;
                }
            })
            .catch(error => { 
                console.log(error);
            });
    }


    buildJSON()
    {
        let finalJSON = [];
        for(var i=1; i<this.dataSheetsWithHeader.length; i++)
        {
            let record = new Object();
            
            for(var j=0; j < this.fieldsMapping.length; j++)
            {
                if(this.fieldsMapping[j].value != null)
                {
                    record[this.fieldsMapping[j].value] = this.dataSheetsWithHeader[i][j];
                }
            }

            finalJSON.push(record);
        }

        return finalJSON;
    }

    //#endregion Import

    showToast(toastTitle, toastMessage, status, mode)
    {
        const event = new ShowToastEvent({
            title: toastTitle,
            message: toastMessage,
            variant: status,
            mode: mode,
        });
        this.dispatchEvent(event);
    }

    //#region Modal
    showConfirmationModal()
    {
        this.showConfirmButton = true;
        this.message = 'Ya está todo listo para la importación de sus datos. ¿Está seguro de que desea empezar con la importación?';
        this.isHtml = false;
        this.modalTitle = '¿Está seguro de que desea continuar?';
        this.showModal = true;
    }

    confirmModal()
    {
        
        this.showModal = false;
        this.currentState = this.IMPORT;
        this.jsonToImport = this.buildJSON();
        this.finishImport(this.jsonToImport.slice(0,this.BATCH_SIZE));
    }

    closeModal()
    {
        this.showModal = false;
    }
    //#endregion Modal

    restart()
    {
        this.currentState = this.CHOOSE_OPERATION;
        this.objectPicked = null;
        this.objectPickedFields = null;
        this.uploadedFile = null;
        this.upsertFieldPicked = null;

        this.workbook = null;
        this.dataSheets = [];
        this.dataSheetsWithHeader = [];

        this.columns = null;
        this.data = null;
        this.keyField = null;

        this.fieldsMapping = null;
        this.mappingFile = null;

        this.jsonToImport = null;
        this.processedRecords = 0;

        this.stopImporting = false;

        this.errors = [];
        this.success = [];
    }
    //#endregion Methods
}