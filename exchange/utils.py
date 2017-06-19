import logging
from django.conf import settings
from django.contrib.auth.signals import user_logged_in

logger = logging.getLogger(__name__)


def rows_to_dict_list(cursor):
    columns = [i[0] for i in cursor.description]
    return [dict(zip(columns, row)) for row in cursor]


'''

Queries the Oracle DB by username for the CUST_LINK value which
is used to determine which aircrafts the user has access to by
organization account.

'''


def get_customer_link(username):
    organizations = []
    statement = '''
        SELECT a.cust_link
        FROM seaganweb.get_user_info_11g_mv a
        WHERE UPPER(a.userid) = UPPER(:user_id)
        '''
    accounts = get_records(statement, {'user_id': username})
    for account in accounts:
        customer_link = account['CUST_LINK']
        if customer_link:
            parts = customer_link.split(' ')
            for customer_id in parts:
                if customer_id and customer_id.strip().isdigit():
                    organizations.append(customer_id)

    return organizations

'''

Looks up a customer record to get the current list of associated organization accounts

'''


def lookup_customer(sender, user, request, **kwargs):
    if not request.user.organization:
        logger.debug('>>>>>>>>> Looking up organization for user %s <<<<<<<<<<<<<' % request.user.username)
        uo = get_customer_link(request.user.username)
        user.organization = ",".join(str(i).strip() for i in uo)
        user.save()

'''

Exectue Queries against the Orcale DB

'''


def get_records(statement, params):
    records = []
    cur = None
    con = None
    try:
        import cx_Oracle
        dsn_tns = cx_Oracle.makedsn(settings.DATABASES['oracle']['HOST'],
                                    settings.DATABASES['oracle']['PORT'],
                                    service_name=settings.DATABASES['oracle']['SERVICE_NAME'])
        con = cx_Oracle.connect(settings.DATABASES['oracle']['NAME'],
                                settings.DATABASES['oracle']['PASSWORD'], dsn_tns)
        cur = con.cursor()
        cur.prepare(statement)
        cur.execute(None, params)
        records = rows_to_dict_list(cur)
    except Exception as e:
        logging.error(e, exc_info=True)
    finally:
        if cur and con:
            cur.close()
            con.close()

    return records

user_logged_in.connect(lookup_customer)
