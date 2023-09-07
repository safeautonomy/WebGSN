function init() {
    // Check if this is the first page load
    if (sessionStorage.getItem('firstLoad') === null) {
        // Set a flag in sessionStorage to indicate that the page has loaded once
        sessionStorage.setItem('firstLoad', '1');
        window.location.reload();
    };
    const $ = go.GraphObject.make;  // for conciseness in defining templates
    myDiagram =
        new go.Diagram("myDiagramDiv", // must be the ID or reference to div
            {
                allowCopy: false,
                allowDelete: false,
                //initialAutoScale: go.Diagram.Uniform,
                maxSelectionCount: 1, // users can select only one part at a time
                validCycle: go.Diagram.CycleDestinationTree, // make sure users can only create trees
                "clickCreatingTool.archetypeNodeData": { // allow double-click in background to create a new node
                    type: "(Goal, Subgoal, strategy, Context, Solution, Justification, Assumption)",
                    description: "",
                    comments: ""
                },
                "clickCreatingTool.insertPart": function (loc) {  // method override must be function, not =>
                    const node = go.ClickCreatingTool.prototype.insertPart.call(this, loc);
                    if (node !== null) {
                        this.diagram.select(node);
                        this.diagram.commandHandler.scrollToPart(node);
                        this.diagram.commandHandler.editTextBlock(node.findObject("TYPETB"));
                    }
                    return node;
                },
                layout:
                    $(go.TreeLayout,
                        {
                            // treeStyle: go.TreeLayout.StyleLastParents,
                            arrangement: go.TreeLayout.ArrangementHorizontal,
                            // properties for most of the tree:
                            angle: 90,
                            layerSpacing: 35,
                            // properties for the "last parents":
                            alternateAngle: 90,
                            alternateLayerSpacing: 35,
                            // alternateAlignment: go.TreeLayout.AlignmentBus,
                            alternateNodeSpacing: 100,
                            setsPortSpot: false,
                            setsChildPortSpot: false
                        }),
                "undoManager.isEnabled": true // enable undo & redo
                
            });
           
     //fetch Data
     const getSafetyCase = async() => { 
        try{ 
        const res = await fetch(`http://localhost:5000/safetycases`);
        const data = await res.json();
        load(data);
        // console.log(`topic: ${data.data[0].topic}`);
        document.getElementById("mySavedModel").value = JSON.stringify(data);
        myDiagram.add(
            $(go.Part, { location: new go.Point(0, 10) },
            $(go.Panel, "Table",
            $(go.TextBlock, "Topic: ", textStyle(),
            { font: "Arial, Helvetica, sans-serif", row: 0, column: 0, margin: 1 }),
            $(go.TextBlock, data.data[0].topic, { font: "20px Arial, Helvetica, sans-serif", stroke: "black", row: 0, column: 1, name: "topicTextBlock" })))),
            new go.Binding("text", data.data[0].topic ).makeTwoWay();
        } catch(error){
        console.log(error)
        }
    };
    getSafetyCase();

    // Create a data object for the diagram's topic
     const diagramData = {
        topic: "Your Topic Here", // Initial topic value
    };
    // Set up a binding between the topic and the TextBlock
    myDiagram.model = go.GraphObject.make(go.GraphLinksModel, {
        nodeDataArray: [], // Your node data array
        linkDataArray: [], // Your link data array
    });
    // Add the topic to the model
    myDiagram.model.addNodeData(diagramData);
    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", e => {
        // console.log("it's modified");
        const button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        const idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.slice(0, idx);
        }
    });

    const levelColors = ["#000000"];

    // override TreeLayout.commitNodes to also modify the background brush based on the tree depth level
        myDiagram.layout.commitNodes = function () {  // method override must be function, not =>
        go.TreeLayout.prototype.commitNodes.call(this);  // do the standard behavior
    //     // then go through all of the vertexes and set their corresponding node's Shape.fill
    //     // to a brush dependent on the TreeVertex.level value
        myDiagram.layout.network.vertexes.each(v => {
            if (v.node) {
                const level = v.level % (levelColors.length);
                const color = levelColors[level];
                const shape = v.node.findObject("SHAPE");
                if (shape) shape.stroke = $(go.Brush, "Linear", { 0: color, 1: go.Brush.lightenBy(color, 0.05), start: go.Spot.Left, end: go.Spot.Right });
            }
        });
    };

    // this is used to determine feedback during drags
    function mayWorkFor(node1, node2) {
        if (!(node1 instanceof go.Node)) return false;  // must be a Node
        if (node1 === node2) return false;  // cannot work for yourself
        if (node2.isInTreeOf(node1)) return false;  // cannot work for someone who works for you
        return true;
    }
    // This function provides a common style for most of the TextBlocks.
    // Some of these values may be overridden in a particular TextBlock.
    function textStyle() {
        return { font: "12pt  'Arial, Helvetica, sans-serif", stroke: "black", spacingAbove: 3, spacingBelow: 3 };
    };

    // define the Node template
    myDiagram.nodeTemplate =
    $(go.Node, "Spot",
        {   selectionObjectName: "BODY",
            mouseEnter: (e, node) => node.findObject("BUTTON").opacity = node.findObject("BUTTONX").opacity = 1,
            mouseLeave: (e, node) => node.findObject("BUTTON").opacity = node.findObject("BUTTONX").opacity = 0,
            // handle dragging a Node onto a Node to (maybe) change the reporting relationship
            mouseDragEnter: (e, node, prev) => {
                const diagram = node.diagram;
                const selnode = diagram.selection.first();
                if (!mayWorkFor(selnode, node)) return;
                const shape = node.findObject("SHAPE");
                if (shape) {
                    shape._prevFill = shape.fill;  // remember the original brush
                    shape.fill = "darkred";
                }
            },
            mouseDragLeave: (e, node, next) => {
                const shape = node.findObject("SHAPE");
                if (shape && shape._prevFill) {
                    shape.fill = shape._prevFill;  // restore the original brush
                }
            },
            mouseDrop: (e, node) => {
                const diagram = node.diagram;
                const selnode = diagram.selection.first();  // assume just one Node in selection
                if (mayWorkFor(selnode, node)) {
                    // find any existing link into the selected node
                    const link = selnode.findTreeParentLink();
                    if (link !== null) {  // reconnect any existing link
                        link.fromNode = node;
                    } else {  // else create a new link
                        diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);
                    }
                }
            }
        },
        // for sorting, have the Node.text be the data.name
        new go.Binding("text", "type"),
        // bind the Part.layerName to control the Node's layer depending on whether it isSelected
        new go.Binding("layerName", "isSelected", sel => sel ? "Foreground" : "").ofObject(),
        $(go.Panel, "Auto",
            { name: "BODY" },
            // define the node's outer shape
            $(go.Shape, "Rectangle",
                { name: "SHAPE", fill: "#ffffff", stroke: 'white', strokeWidth: 5, portId: "", width: 300, height: NaN },
                // fullfill change color
                // new go.Binding("fill", "fullfill", function(fullfill) {
                //     return fullfill ? "lightgray" : "white";
                // })
                ),  
            $(go.Panel, "Horizontal",
                $(go.Panel, "Table",
                    {
                        minSize: new go.Size(130, NaN),
                        maxSize: new go.Size(200, NaN),
                        margin: new go.Margin(6, 10, 0, 6),
                        defaultAlignment: go.Spot.Left,
                    },
                    $(go.RowColumnDefinition, { column: 2, width: 4}),
                    $(go.TextBlock, textStyle(),
                    { row: 0, column: 0, margin: 3 }),
                    $(go.TextBlock, textStyle(),  // the name
                        {
                            name: "TYPETB",
                            row: 0, column: 0, columnSpan: 1,
                            font: "bold 20px Arial, Serif",
                            editable: true, isMultiline: false,
                            minSize: new go.Size(50, 16),
                            margin:(0, 0, 5, 0),
                        },
                        new go.Binding("text", "type").makeTwoWay()),
                    $(go.TextBlock, "Description: ", textStyle(),
                        { row: 3, column: 0, margin: 3 }),
                    $(go.TextBlock, textStyle(),
                        {
                            row: 4, column: 0, columnSpan: 4,
                            editable: true, isMultiline: false,
                            minSize: new go.Size(50, 14),
                            margin: new go.Margin(0, 0, 0, 3)
                        },
                        new go.Binding("text", "description").makeTwoWay()),
                    $(go.TextBlock, textStyle(),
                        { row: 1, column: 0, margin: 3 },
                        new go.Binding("text", "key", v => "ID: " + v)),
                    // $(go.TextBlock, textStyle(),
                    //     { row: 2, column: 0, margin: 3 },
                    //     new go.Binding("text", "fullfill", f => "Fullfill: " + f)),
                    $(go.TextBlock, textStyle(),  // the comments
                        {
                            row: 4, column: 0, columnSpan: 5,
                            font: "12pt 'VT323', monospace",
                            wrap: go.TextBlock.WrapFit,
                            editable: true,  // by default newlines are allowed
                            minSize: new go.Size(100, 14),
                        },
                        new go.Binding("text", "comments").makeTwoWay())
                ) // end Table Panel
            ) // end Horizontal Panel
        ), // end Auto Panel
        $("Button",
            $(go.Shape, "PlusLine", { width: 10, height: 10 }),
            {
                name: "BUTTON", alignment: go.Spot.Right, opacity: 0,  // initially not visible
                click: (e, button) => addEmployee(button.part)
            },
            // button is visible either when node is selected or on mouse-over
            new go.Binding("opacity", "isSelected", s => s ? 1 : 0).ofObject()
        ),
        new go.Binding("isTreeExpanded").makeTwoWay(),
        $("TreeExpanderButton",
            {
                name: "BUTTONX", alignment: go.Spot.Bottom, opacity: 0,  // initially not visible
                "_treeExpandedFigure": "TriangleUp",
                "_treeCollapsedFigure": "TriangleDown"
            },
            // button is visible either when node is selected or on mouse-over
            new go.Binding("opacity", "isSelected", s => s ? 1 : 0).ofObject()
        ),
        // Bind fromSpot and toSpot to the linkDirection property
        new go.Binding("fromSpot", "linkDirection", function (linkDirection) {
            if (linkDirection === "Top") return go.Spot.Top;
            if (linkDirection === "Bottom") return go.Spot.Bottom;
            if (linkDirection === "Left") return go.Spot.Left;
            if (linkDirection === "Right") return go.Spot.Right;
            return go.Spot.Bottom;  // Default value
        }),
        new go.Binding("toSpot", "linkDirection", function (linkDirection) {
            if (linkDirection === "Top") return go.Spot.Bottom;
            if (linkDirection === "Bottom") return go.Spot.Top;
            if (linkDirection === "Left") return go.Spot.Right;
            if (linkDirection === "Right") return go.Spot.Left;
            return go.Spot.Top;  // Default value
        }),
    );  // end Node, a Spot Panel

    function addEmployee(node) {
        if (!node) return;
        const thisemp = node.data;
        myDiagram.startTransaction("Add Task");
        // When add a new node alert
        const newType = window.prompt("Enter type for the new task: ", "Goal, Subgoal, strategy, Context, Solution, Justification, Assumption");
        if (newType !== null) {
        const newemp = {
                type: newType,
                comments: "",
                parent: thisemp.key,
                linkDirection: "",
            };
            if (/Subgoal.*/i.test(newType) || /G.*/.test(newType)) {
                newemp.linkDirection = "bottom";
            } else if (/Solution.*/i.test(newType) || /Sn.*/.test(newType)) {
                newemp.linkDirection = "bottom";
            } else if (/Strategy.*/i.test(newType) || /S.*/.test(newType)) {
                newemp.linkDirection = "bottom";
            } else if (/Context.*/i.test(newType) || /C.*/.test(newType)) {
                newemp.linkDirection = "right";
            } else if (/Assumption.*/i.test(newType) || /Justification.*/i.test(newType) || /J.*/.test(newType) || /A.*/.test(newType)) {
                newemp.linkDirection = "left";
            }
            myDiagram.model.addNodeData(newemp);
            const newnode = myDiagram.findNodeForData(newemp);
            if (newnode) newnode.location = node.location;
            setNodeShape(newnode);
            myDiagram.commandHandler.scrollToPart(newnode);
        }
        myDiagram.commitTransaction("Add Task");
    };

    // the context menu allows users to make a position vacant,
    // remove a role and reassign the subtree, or remove a department
    myDiagram.nodeTemplate.contextMenu =
        $("ContextMenu",
            $("ContextMenuButton",
                $(go.TextBlock, "Add Task"),
                {
                    click: (e, button) => addEmployee(button.part.adornedPart)
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Vacate Task"),
                {
                    click: (e, button) => {
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            const thisemp = node.data;
                            myDiagram.startTransaction("vacate");
                            // update the key, name, picture, and comments, but leave the title
                            myDiagram.model.setDataProperty(thisemp, "type", "(Vacant)");
                            // myDiagram.model.setDataProperty(thisemp, "pic", "");
                            myDiagram.model.setDataProperty(thisemp, "comments", ""); 
                            myDiagram.commitTransaction("vacate");
                        }
                    }
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Remove Task"),
                {
                    click: (e, button) => {
                        // reparent the subtree to this node's boss, then remove the node
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            myDiagram.startTransaction("reparent remove");
                            const chl = node.findTreeChildrenNodes();
                            // iterate through the children and set their parent key to our selected node's parent key
                            while (chl.next()) {
                                const emp = chl.value;
                                myDiagram.model.setParentKeyForNodeData(emp.data, node.findTreeParentNode().data.key);
                            }
                            // and now remove the selected node itself
                            myDiagram.model.removeNodeData(node.data);
                            myDiagram.commitTransaction("reparent remove");
                        }
                    }
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Remove Tree"),
                {
                    click: (e, button) => {
                        // remove the whole subtree, including the node itself
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            myDiagram.startTransaction("remove dept");
                            myDiagram.removeParts(node.findTreeParts());
                            myDiagram.commitTransaction("remove dept");
                        }
                    }
                }
            )
        );

    // define the Link template
    myDiagram.linkTemplate =
        $(go.Link,
            {
                layerName: "Background",
                routing: go.Link.AvoidsNodes,
                corner: 10,  
                toShortLength: 7,     
            },
            $(go.Shape, 
            { 
                strokeWidth: 5,
            }),
            $(go.Shape, { 
                toArrow: "Standard",
                fill: "yellow",
                strokeWidth: 3, 
                stroke: "black" 
            }),
            new go.Binding("fromSpot", "fromSpot", go.Spot.parse),
            new go.Binding("toSpot", "toSpot", go.Spot.parse),
        new go.Binding("fromSpot", "", function (data) {
            if (data.linkDirection && data.linkDirection.toLowerCase() === "top") {
                return go.Spot.Top;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "bottom") {
                return go.Spot.Bottom;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "left") {
                return go.Spot.Left;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "right") {
                return go.Spot.Right;
            } else {
                return go.Spot.Bottom; // Default value
            }
        }),
        new go.Binding("toSpot", "", function (data) {
            if (data.linkDirection && data.linkDirection.toLowerCase() === "top") {
                return go.Spot.Bottom;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "bottom") {
                return go.Spot.Top;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "left") {
                return go.Spot.Right;
            } else if (data.linkDirection && data.linkDirection.toLowerCase() === "right") {
                return go.Spot.Left;
            } else {
                return go.Spot.Top; // Default value
            }
        })        
        
        );  // the link shape
        

    // support editing the properties of the selected person in HTML
    if (window.Inspector) myInspector = new Inspector("myInspector", myDiagram,
    {
        properties: {
        "_id": { readOnly: true, show: false },
        "key": { readOnly: true },
        "type": {}, 
        "description": {}, 
        "comments": {},
        "fullfill": { type: "select", choices: ["true", "false"], show: false },
        "pic": {show: false},
        "linkDirection": {
            type: "select",
            choices: ["top", "bottom", "left", "right"],
        },
    }}
    );
  
    // Setup zoom to fit button
    document.getElementById('zoomToFit').addEventListener('click', () => myDiagram.commandHandler.zoomToFit());
    document.getElementById('centerRoot').addEventListener('click', () => {
        myDiagram.scale = 1;
        myDiagram.commandHandler.scrollToPart(myDiagram.findNodeForKey(1));
        
    });

    // Update the link direction when the user changes it in the inspector
    myInspector._updateTarget = function (id, value) {
        let diagram = myDiagram;
    diagram.startTransaction("updateLinkDirection");
    let selectedNode = diagram.selection.first();
    if (selectedNode && id === "linkDirection") {
        // Update the link direction property of the selected node
        selectedNode.data.linkDirection = value;
        // Update fromSpot and toSpot based on the linkDirection
        if (value === "top") {
            selectedNode.data.fromSpot = go.Spot.Top;
            selectedNode.data.toSpot = go.Spot.Bottom;
        } else if (value === "bottom") {
            selectedNode.data.fromSpot = go.Spot.Bottom;
            selectedNode.data.toSpot = go.Spot.Top;
        } else if (value === "left") {
            selectedNode.data.fromSpot = go.Spot.Left;
            selectedNode.data.toSpot = go.Spot.Right;
        } else if (value === "right") {
            selectedNode.data.fromSpot = go.Spot.Right;
            selectedNode.data.toSpot = go.Spot.Left;
        } else {
            // Set default values here if needed
        }
        diagram.commitTransaction("updateLinkDirection");
        // After updating the property, update the diagram to reflect the changes
        diagram.updateAllTargetBindings(selectedNode);
    }
    };

    // get modified JSON
    const modifiedJSON = document.getElementById("mySavedModel").value;
    // Add an event listener to the "Update Data" button
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.addEventListener("click", () => {
    const modifiedJSON = document.getElementById("mySavedModel").value;
    updateDatabase(modifiedJSON);
    });
    // Enable the button when you have modifiedJSON
    function enableUpdateButton() {
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.removeAttribute("disabled");
    };
    function disableUpdateButton() {
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.setAttribute("disabled", "true");
    };
    document.getElementById('SaveButton').addEventListener('click', () => enableUpdateButton());
    document.getElementById('updateDataButton').addEventListener('click', () => disableUpdateButton());
    // update topic
    document.getElementById('updateTopic').addEventListener('click', () =>{
        const topicInput = document.getElementById('topicInput').value;
        updateTopic(topicInput);
    });
    document.getElementById('topicInput').addEventListener('input', function () {
        const topicInputValue = document.getElementById('topicInput').value;
        const updateTopicButton = document.getElementById('updateTopic');
        // Check if the input value is not empty and enable/disable the button accordingly
        if (topicInputValue !== '') {
            updateTopicButton.removeAttribute('disabled');
        } else {
            updateTopicButton.setAttribute('disabled', 'true');
        }
    });
    // save as image
    document.getElementById("blobButton").addEventListener("click", makeBlob);
    // save as JSON
    document.getElementById("downloadJsonButton").addEventListener("click", downloadJson);
 
} // end init

// Add a custom function to set the shape based on the "type" property
function setNodeShape(node) {
    const shape = node.findObject("SHAPE");
    const type = node.data.type;
    if (shape && type) {
        if (/Subgoal.*/i.test(type) || /G.*/.test(type)) {
            shape.figure = "Rectangle";
            // shape.fill = "lightblue";
        } else if (/Solution.*/i.test(type) || /Sn.*/.test(type)) {
            shape.figure = "Circle";
            // shape.fill = "lightgreen";
        } else if (/Strategy.*/i.test(type) || /S.*/.test(type)) {
            shape.figure = "Parallelogram";
            // shape.fill = "lightgreen";
            // console.log(shape);
        } else if (/Context.*/i.test(type) || /C.*/.test(type)) {
            shape.figure = "Terminator";
            // shape.fill = "lightgreen";
        } else if (/Assumption.*/i.test(type) || /Justification.*/i.test(type) || /J.*/.test(type) || /A.*/.test(type)) {
            shape.figure = "Ellipse";
            // shape.fill = "lightgreen";
        };
        // Set the fromSpot and toSpot based on linkDirection property
    const linkDirection = node.data.linkDirection;
    if (linkDirection) {
        if (linkDirection === "top") {
            node.fromSpot = go.Spot.Top;
            node.toSpot = go.Spot.Bottom;
        } else if (linkDirection === "bottom") {
            node.fromSpot = go.Spot.Bottom;
            node.toSpot = go.Spot.Top;
        } else if (linkDirection === "left") {
            node.fromSpot = go.Spot.Left;
            node.toSpot = go.Spot.Right;
        } else if (linkDirection === "right") {
            node.fromSpot = go.Spot.Right;
            node.toSpot = go.Spot.Left;
        }
    }
        if (linkDirection) {
            if (linkDirection === "left" || linkDirection === "right") {
                // Adjust the alignment for "left" and "right" links
                node.alignment = new go.Spot(0.5, 0.5);
            }
        }
    }
};

function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
};

function load(data) {
    // myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    if (data && data.data[0].nodeDataArray) {
        const modelData = data.data[0].nodeDataArray;
        const treeModel = go.GraphObject.make(go.TreeModel);
        treeModel.nodeDataArray = modelData;
        myDiagram.model = treeModel;
        // Call setNodeShape for each node in the diagram to set the shapes correctly
        myDiagram.nodes.each(node => {setNodeShape(node); myDiagram.updateAllTargetBindings(node);});
        // console.log("Data loaded:", modelData);
        const topicTextBlock = myDiagram.findNodeForKey(1).findObject("topicTextBlock");
        if (topicTextBlock) {
            topicTextBlock.text = data.data[0].topic;
        };
        // make sure new data keys are unique positive integers
        let lastkey = 1;
        myDiagram.model.makeUniqueKeyFunction = (model, modelData) => {
            let k = modelData.key || lastkey;
            while (model.findNodeDataForKey(k)) k++;
            modelData.key = lastkey = k;
            return k;
        };
    } else {
        console.error("Data is missing or invalid.");
    }
};

// update from edit
async function updateDatabase(modifiedJSON) {
    const modifiedData = JSON.parse(modifiedJSON);
    delete modifiedData.class;
    const finalModifiedJson = JSON.stringify(modifiedData);
    console.log(finalModifiedJson);
    try {
        const response = await fetch('http://localhost:5000/safetycases/64e49de0884ff8008dcfc289', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: finalModifiedJson,
        });
        if (response.ok) {
            console.log('Data updated successfully.');
            location.reload();
        } else {
            console.error('Failed to update data.');
        }
    } catch (error) {
        console.error('Error updating data:', error);
    }
};

// save image
function myCallback(blob) {
    let url = window.URL.createObjectURL(blob);
    let filename = "myBlobFile.png";
    let a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;
    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, filename);
      return;
    }
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  function makeBlob() {
    var blob = myDiagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
  };

  //save JSON
  function downloadJson() {
    // Get the JSON data from the mySavedModel textarea
    const jsonData = document.getElementById("mySavedModel").value;
    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: "application/json" });
    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mySavedModel.json";
    // Trigger the click event on the link to start the download
    a.click();
    // Clean up by revoking the object URL
    URL.revokeObjectURL(a.href);
};

  // update topic
  async function updateTopic(newTopic) {
    try {
        // Define the data to be sent in the request body
        const data = { topic: newTopic };
        const response = await fetch('http://localhost:5000/safetycases/64e49de0884ff8008dcfc289', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            console.log('Topic updated successfully in the database.');
            location.reload();
        } else {
            console.error('Failed to update the topic in the database.');
        };
    } catch (error) {
        console.error('Error updating the topic in the database:', error);
    };
};



window.addEventListener('DOMContentLoaded', init);
