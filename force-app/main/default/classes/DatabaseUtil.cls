/**
 * Clase de utilidades relacionada con Database
 */
public with sharing class DatabaseUtil
{
    /**
     * Método que interpreta los resultados de guardado. 
     * @author                  rcastanos
     * @param  results          lista de los resultados devueltos de una operación insert, update o upsert
     * @param  currentRecord    número de línea
     * @return                  un mapa que contiene la información de los registros que han dado error y los que han ido correctamente
     */
    public static Map<String,List<String>> manageSaveResult(List<Database.SaveResult> results, Integer currentRecord)
    {
        Map<String,List<String>> messages = new Map<String,List<String>>();

        List<String> errors = new List<String>();
        List<String> success = new List<String>();

        for(Integer i=0; i < results.size(); i++)
        {
            Database.SaveResult result = results[i];
            Integer lineNumber = i+currentRecord;

            if(!result.getErrors().isEmpty())
            {
                for(Database.Error error : result.getErrors())
                {
                    errors.add('Línea ' + lineNumber + ': ' +error.getMessage());
                }
            }
            else if(result.isSuccess())
            {
                success.add('Línea ' + lineNumber + ': ' +result.getId());
            }
        }

        messages.put('success', success);
        messages.put('errors', errors);

        System.debug(errors);

        return messages;
    }

    /**
     * Método que interpreta los resultados de eliminación. 
     * @author                  rcastanos
     * @param  results          lista de los resultados devueltos de una operación delete
     * @param  currentRecord    número de línea
     * @return                  un mapa que contiene la información de los registros que han dado error y los que han ido correctamente
     */
    public static Map<String,List<String>> manageDeleteResult(List<Database.DeleteResult> results, Integer currentRecord)
    {
        Map<String,List<String>> messages = new Map<String,List<String>>();

        List<String> errors = new List<String>();
        List<String> success = new List<String>();

        for(Integer i=0; i < results.size(); i++)
        {
            Database.DeleteResult result = results[i];
            Integer lineNumber = i+currentRecord;

            if(!result.getErrors().isEmpty())
            {
                for(Database.Error error : result.getErrors())
                {
                    errors.add('Línea ' + lineNumber + ': ' +error.getMessage());
                }
            }
            else if(result.isSuccess())
            {
                success.add('Línea ' + lineNumber + ': ' +result.getId());
            }
        }

        messages.put('success', success);
        messages.put('errors', errors);

        return messages;
    }
}