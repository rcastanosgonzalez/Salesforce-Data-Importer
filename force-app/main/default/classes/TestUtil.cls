/**
 * Clase wde utilidades para las clases de Test
 */
public with sharing class TestUtil
{
    /**
     * Método que genera cuentas
     * @author                  rcastanos
     * @param  amount           número de cuentas que se desea generar
     * @param  validAccounts    indica si se quiere generar cuentas válidas
     * @return                  una lista de cuentas generadas
     */
    public static List<Account> generateAccounts(Integer amount, Boolean validAccounts)
    {
        List<Account> accounts = new List<Account>();

        for(Integer i=0; i<amount; i++)
        {
            Account account = new Account();

            account.Description = 'Description'+i;

            if(validAccounts)
            {
                account.Name = 'Name'+i;
            }

            accounts.add(account);
        }

        return accounts;
    }
}