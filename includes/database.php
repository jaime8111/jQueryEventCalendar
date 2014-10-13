<?
/*
EXAMPLE HOW TO USE IT
$Query = "SELECT * FROM wp_posts WHERE post_status = 'publish' ORDER BY post_date DESC LIMIT 1";
$db->query($Query);        // query the database
$db->singleRecord();    // retrieve a single record


echo $db->Record['post_title'];        // output a field value from the recordset
echo "<hr>";
// do a query to retrieve multiple records
$Query = "SELECT * FROM wp_posts WHERE post_status = 'publish'";
$db->query($Query);        // query the database
while ($db->nextRecord())
    {
    echo $db->Record['post_title']."<br>";        // output a field value from the recordset
    }
*/
class Database
    {
    var $Host     = "localhost";// Hostname of our MySQL server.
    var $Database = "vissit"; // Logical database name on that server.
    var $User     = "root"; // User and Password for login.
    var $Password = "";

    var $Link_ID  = 0;  // Result of mysql_connect().
    var $Query_ID = 0;  // Result of most recent mysql_query().
    var $Record   = array();  // current mysql_fetch_array()-result.
    var $Row;           // current row number.
    var $LoginError = "";

    var $Errno    = 0;  // error state of query...
    var $Error    = "";


    public function __construct($host){
        $this->Host = $host["host"];
        $this->Database = $host["dataBase"];
        $this->User = $host["user"];
        $this->Password = $host["pass"];
    }
//-------------------------------------------
//    Connects to the database
//-------------------------------------------
    function connect()
        {
        if( 0 == $this->Link_ID )
            $this->Link_ID=mysql_connect( $this->Host, $this->User, $this->Password );
        if( !$this->Link_ID )
            $this->halt( "Link-ID == false, connect failed" );
        if( !mysql_query( sprintf( "use %s", $this->Database ), $this->Link_ID ) )
            $this->halt( "cannot use database ".$this->Database );
        } // end function connect

//-------------------------------------------
//    Queries the database
//-------------------------------------------
    function query( $Query_String )
        {
        //echo "<hr>$Query_String<hr>";
        $this->connect();
        $this->Query_ID = mysql_query( $Query_String,$this->Link_ID );
        $this->Row = 0;
        $this->Errno = mysql_errno();
        $this->Error = mysql_error();
        if( !$this->Query_ID )
            $this->halt( "Invalid SQL: ".$Query_String );
        return $this->Query_ID;
        } // end function query

//-------------------------------------------
//    If error, halts the program
//-------------------------------------------
    function halt( $msg )
        {
        printf( "</td></tr></table><b>Database error:</b> %s<br>n", $msg );
        printf( "<b>MySQL Error</b>: %s (%s)<br>n", $this->Errno, $this->Error );
        die( "Session halted." );
        } // end function halt

//-------------------------------------------
//    Retrieves the next record in a recordset
//-------------------------------------------
    function nextRecord()
        {
        @ $this->Record = mysql_fetch_array( $this->Query_ID );
        $this->Row += 1;
        $this->Errno = mysql_errno();
        $this->Error = mysql_error();
        $stat = is_array( $this->Record );
        if( !$stat )
            {
            @ mysql_free_result( $this->Query_ID );
            $this->Query_ID = 0;
            }
        return $stat;
        } // end function nextRecord

//-------------------------------------------
//    Retrieves a single record
//-------------------------------------------
    function singleRecord()
        {
        $this->Record = mysql_fetch_array( $this->Query_ID );
        $stat = is_array( $this->Record );
        return $stat;
        } // end function singleRecord

//-------------------------------------------
//    Returns the number of rows  in a recordset
//-------------------------------------------
    function numRows()
        {
        return mysql_num_rows( $this->Query_ID );
        } // end function numRows

    } // end class Database
?>