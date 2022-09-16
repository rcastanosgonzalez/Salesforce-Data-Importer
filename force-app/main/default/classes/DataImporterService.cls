/**
 * Clase que contiene los métodos utilizados por el componente LWC dataImporter
 */

public with sharing class DataImporterService
{
    private static Savepoint sp;
    private static Map<String,List<String>> response = new Map<String,List<String>>();

    /**
     * Método que gestiona la importación de los datos. 
     * @author                  rcastanos
     * @param  jsonEntry        un JSON que contiene todos los datos que se desean importar
     * @param  objectType       especifíca a qué objeto de Salesforce se refiere el JSON
     * @param  operationType    especifica la clase de operación que se desea realizar en la importación (insert, update, upsert o delete)
     * @param  upsertField      si la operación es un upsert, se especifíca por qué campo se desea realizar esta operación
     * @param  currentRecord    especifíca el número actual de registros que han sido procesados. 
     * @param  draftMode        se utiliza para comprobar si el JSON es correcto para importar. Si se habilita, el proceso de importación no guardará los registros en Salesforce. Pero sí que retornará los resultados de la operación.
     * @return                  un mapa que contiene la información de los registros que han dado error y los que han ido correctamente
     */
    @AuraEnabled
    public static Map<String,List<String>> importData(String jsonEntry, String objectType, String operationType, String upsertField, Integer currentRecord, Boolean draftMode)
    {
        
        if(draftMode)
        {
            sp = Database.setSavepoint();
        }

        Type classType = Type.forName('List<'+objectType+'>');

        List<SObject> objects = (List<SObject>) JSON.deserialize(jsonEntry, classType);

        switch on operationType.toLowerCase()
        {
            when  'insert'
            {
                List<Database.SaveResult> results = Database.insert(objects, false);
                response = DatabaseUtil.manageSaveResult(results, currentRecord);
            }
            when  'update'
            {
                List<Database.SaveResult> results = Database.update(objects, false);
                response = DatabaseUtil.manageSaveResult(results, currentRecord);
            }
            when  'upsert'
            {
                //Como no se puede realizar un upsert por un campo específico con una lista de 
                //objetos no definidos dividimos la operación en una insert y en un update

                //Primero realizamos una query para ver qué registros tenemos ya en base al campo upsert
                Set<String> externalIds = new Set<String>();
                for (SObject so : objects)
                {
                    externalIds.add((String) so.get(upsertField));
                }

                String query = 'SELECT Id, ' + upsertField + ' FROM ' + objectType + ' WHERE ' + upsertField + ' IN :externalIds';

                List<SObject> queriedObjects = Database.query(query);
                Map<String,SObject> queriedObjectsMap = Util.getObjectMap(queriedObjects, upsertField);

                List<SObject> toInsert = new List<SObject>();
                List<SObject> toUpdate = new List<SObject>();

                //Recorremos todos los objetos y miramos si han sido devueltos por la query
                //Si lo han sido, se realizará un update
                //Si no lo han sido, se realizará un insert
                for(SObject currentObject : objects)
                {
                    String value = String.valueOf(currentObject.get(upsertField));
                    if(queriedObjectsMap.containsKey(value))
                    {
                        currentObject.put('Id', queriedObjectsMap.get(value).Id);
                        toUpdate.add(currentObject);
                    }
                    else
                    {
                        toInsert.add(currentObject);
                    }
                }

                List<Database.SaveResult> results = Database.insert(toInsert, false);
                results.addAll(Database.update(toUpdate, false));

                response = DatabaseUtil.manageSaveResult(results, currentRecord);
            }
            when  'delete'
            {
                List<Database.DeleteResult> results = Database.delete(objects, false);
                response = DatabaseUtil.manageDeleteResult(results, currentRecord);
            }
        }

        if(draftMode)
        {
            Database.rollback(sp);
        }

        return response;
    }
}