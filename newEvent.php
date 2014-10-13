<?
    include_once('includes/header.php');
?>
<body id="responsiveDemo">

    <div class="container">
        <div class="row">
            <div class="g12">
                <h2 class="h4">New event</h2>
                <p class="demoDesc">With this form you can create a new event.</p>
                <form id="newEventForm">
                    <div class="fg">
                        <label>Event Title</label>
                        <input id="title" name="title" type="text" class="text large" />
                    </div>
                    <div class="fg">
                        <label>Event Type</label>
                        <select id="type"  name="type" class="large">
                        <?
                        $groupQuery = "SELECT id, name FROM eventstypes ORDER BY name";
                        $db->query($groupQuery);        // query the database
                        while ($db->nextRecord())
                            {
                            echo "<option value='".$db->Record['id']."'>".$db->Record['name']."</option>";
                        }
                        ?>
                        </select>
                    </div>
                    <a id="createEventTrigger" href="#" class="bt">Create event</a>
                </form>

            </div>
        </div>
    </div>
</body>
<?
    include_once('includes/footer.php');
?>