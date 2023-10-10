# WebGSN

A web-based tool for viewing and modifying assurance arguments in Goal-Structured-Notation (GSN), with capabilities to store the assurance argument as a local file or into a database

[How to use WebGSN](https://www.youtube.com/watch?v=CIrv9jM2jyo)

<div id="badges" align="center">
  <a href="https://nodejs.org/en">
    <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  </a>
  <a href="https://docs.npmjs.com/downloading-and-installing-node-js-and-npm">
    <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white"/>
  </a>
  <a href="https://gojs.net/latest/learn/graphObject.html">
  <img src="https://img.shields.io/badge/Go%20%20%20GoJs-004880?style=for-the-badge&logo=&logoColor=white">
  </a>
  <a href="https://www.mongodb.com/">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white">
  </a>
  <a href="https://code.visualstudio.com/download">
  <img src="https://img.shields.io/badge/VSCode-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white">
  </a>
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E">
  <img src="https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white">
</div>

### Instruction of installation - on the local machine

* To run this application, **Node.js**, **NPM** package manager are needed (if you have already installed it, please go directly to STEP 2).

1. Install Node.js & NPM with the following command line. (on Terminal) ※Take Linux as example.
```
 $ sudo apt update 
 $ sudo apt install npm
```
2. Clone the repository from  [https://github.com/safeautonomy/WebGSN](https://github.com/safeautonomy/WebGSN)
3. Use VScode to open the **WebGSN-main** folder (when using VSCode, please also install **LiveServer** as an addon).
4. Create a new `.env` file in the **backend** folder.
5. Go to  [https://www.mongodb.com/](https://www.mongodb.com/) set up a database. ([How to set up a NoSQL database on MongoDB](https://docs.google.com/document/d/11Wooh6Nf2jHi10lps3vu3Pq9hC1Gk0q6F0uIBte0Uj8/edit?usp=drive_link))
6. Paste the following text in `.env` file and don’t forget to save.
```
MONGO_URI = URI WHICH YOU GET FROM MONGODB
```
7. In VScode, open two terminals; you could achieve that by clicking ` ◫ `.
8. On one terminal, change the directory to **WebGSN-main/frontend** and install all dependencies.
```
npm i
```
9. On the other terminal, change the directory to **WebGSN-main/backend** and install all dependencies.
```
npm i
```
  Then, run the backend with the following command.
```
npm run dev
```
10. Trigger the web server. (in VSCode, click on **“Go Live”** at the bottom right)

### How to use WebGSN - on the browser

The following instructions provide an overview in terms of how to create an assurance argument from scratch. 

1. Right-click on the root node of the tree (G1).
2. Among four options to be chosen, select `Remove tree`, which enables removing the selected node and its subtrees.
3. Scroll down and press `Update JSON`, and then press `Create Safety Case` button to create your own safety case.
  * There shall be a pop-up window, asking for a topic of your safety case. For example, enter "My_Safety_Case"
4. When you see the page reload back to the template, please search your safety case by typing the **Topic** in the search bar (on the top of the website), then an empty canvas will pop out. 
  * For example, enter "My_Safety_Case"
5. To add a new node, simply double-click the background.
6. This new node has a long type **(Goal, Subgoal, Strategy, Context, Solution, Justification, Assumption)**, please double click on the string, and manually change it to **Goal**. 
11. Hover to an existing node, ` + ` would show up, click to add a new node below. 
12. After pressing ` + `, you would be asked to define the type of the node, By changing **Type**, a node will change its shape
 The format is provided :
   * Goal (G)  → Rectangle
   * Subgoal → Rectangle
   * strategy (S) → Parallelogram
   * Context (C) → Capsule
   * Solution (Sn) → Circle
   * Justification (J) → Ellipse
   * Assumption (A) → Ellipse
13. To edit the details of a node, click on the node, and scroll down to **Details**. The input field would show up for you to edit.
  * **Description** explain the purpose of this node.
  * **Comments** is an optional input for more information, if it’s needed.
  * **linkDirection** decides which direction you wish the node to connect to its parent. 
  * **Parent** references the id number of the node one above your current node. This is generated automatically
17. `Update JSON` button is always needed to be clicked before `Create Safety Case` or `Save Changes`. 
18. To edit, please follow step 9. - 15. and then click `Save Changes` button, so you won't lose the changes.
19. Adjust where those nodes and the **Topic** should be located by Dragging it.
20. If you want to switch a node and its child nodes under another parent node, simply by dragging it to the parent node until the parent turns red and release. 
21. By clicking ` ▲ ` to collapse the diagram.
22. By clicking ` ▼ ` to expand the diagram.
23. Press `Zoom to Fit` or `Center on root`, to include the whole diagram in image before download.
24. Please click `Download Image` to download the image.
25. Please click `Download JSON` to download the JSON file.
