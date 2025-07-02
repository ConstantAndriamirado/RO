const svg = d3.select("svg");

let nodes = [
  { id: 1, x: 100, y: 100 },
  { id: 2, x: 300, y: 100 },
  { id: 3, x: 200, y: 300 }
];

let links = [
  { source: 1, target: 2, value: "5" },
  { source: 2, target: 3, value: "10" }
];

const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id).distance(100))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(200, 200));

const link = svg.selectAll("line")
  .data(links)
  .enter().append("line")
  .attr("stroke", "black")
  .attr("stroke-width", 2)
  .on("dblclick", (event, d) => openModal(d));

const node = svg.selectAll("circle")
  .data(nodes)
  .enter().append("circle")
  .attr("r", 20)
  .attr("fill", "blue")
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended))
  .on("contextmenu", (event, d) => openContextMenu(event, d));

const linkText = svg.selectAll("text")
  .data(links)
  .enter().append("text")
  .text(d => d.value)
  .attr("font-size", "12px")
  .attr("fill", "red");

simulation.on("tick", () => {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  linkText
    .attr("x", d => (d.source.x + d.target.x) / 2)
    .attr("y", d => (d.source.y + d.target.y) / 2);
});

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Modal pour modifier les liens
function openModal(link) {
  const newValue = prompt("Modifier la valeur du lien :", link.value);
  if (newValue !== null) {
    link.value = newValue;
    linkText.text(d => d.value);
  }
}

// Menu contextuel sur les nœuds
function openContextMenu(event, nodeData) {
  event.preventDefault();

  const menu = document.getElementById("context-menu");
  menu.style.left = `${event.pageX}px`;
  menu.style.top = `${event.pageY}px`;
  menu.style.display = "block";

  document.getElementById("delete-node").onclick = () => {
    nodes = nodes.filter(n => n.id !== nodeData.id);
    links = links.filter(l => l.source.id !== nodeData.id && l.target.id !== nodeData.id);
    updateGraph();
  };

  document.getElementById("delete-links").onclick = () => {
    links = links.filter(l => l.source.id !== nodeData.id && l.target.id !== nodeData.id);
    updateGraph();
  };
}

// Mettre à jour le graphe après suppression
function updateGraph() {
  svg.selectAll("line").remove();
  svg.selectAll("circle").remove();
  svg.selectAll("text").remove();
  
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  
  simulation.alpha(1).restart();
}
