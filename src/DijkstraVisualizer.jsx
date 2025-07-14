import '@xyflow/react/dist/style.css';
import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { Button, Modal, Form } from 'react-bootstrap';

// File de priorité pour Dijkstra
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export default function DijkstraVisualizer() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const [nodeCount, setNodeCount] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modalShow, setModalShow] = useState(false);
  const [currentEdge, setCurrentEdge] = useState(null);
  const [distance, setDistance] = useState('');
  const [graphData, setGraphData] = useState([]);
  const [shortestPathModal, setShortestPathModal] = useState(false);
  const [longestPathModal, setLongestPathModal] = useState(false);
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [isEditingEdge, setIsEditingEdge] = useState(false);
  const [edgeToEdit, setEdgeToEdit] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, nodeId: null });
  const [currentPathType, setCurrentPathType] = useState(null);
  const [pathDistance, setPathDistance] = useState(null); // Nouvelle variable pour la distance du chemin

  const defaultNodeStyle = {
    width: 50,
    height: 50,
    borderRadius: '50%',
    backgroundColor: 'white',
    fontSize: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontWeight: 'bold',
    border: '2px solid black',
  };

  const generateLabel = (index) => {
    if (index < 26) return alphabet[index];
    return alphabet[index % 26] + Math.floor(index / 26);
  };

  const addCircle = () => {
    const newId = (nodeCount + 1).toString();
    const newNode = {
      id: newId,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: generateLabel(nodeCount) },
      style: defaultNodeStyle,
      sourcePosition: 'right',
      targetPosition: 'left',
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
    setNodeCount(nodeCount + 1);
  };

  const removeCircle = () => {
    setNodes([]);
    setEdges([]);
    setNodeCount(0);
    setGraphData([]);
    setCurrentPathType(null);
    setPathDistance(null);
  };

  const removeLastCircle = () => {
    if (nodes.length === 0) return;
    const lastNode = nodes[nodes.length - 1].id;
    setNodes((nds) => nds.filter((n) => n.id !== lastNode));
    setEdges((eds) => eds.filter((e) => e.source !== lastNode && e.target !== lastNode));
    setGraphData((prev) => prev.filter((data) => data.source !== lastNode && data.target !== lastNode));
    setNodeCount(nodeCount - 1);
    recalculatePathIfDisplayed();
  };

  const onConnect = useCallback((params) => {
    setCurrentEdge(params);
    setIsEditingEdge(false);
    setModalShow(true);
  }, []);

  const onEdgeClick = (event, edge) => {
    setEdgeToEdit(edge);
    setDistance(edge.label);
    setIsEditingEdge(true);
    setModalShow(true);
  };

  const handleSaveDistance = () => {
    const newDistance = parseInt(distance, 10);
    if (isNaN(newDistance) || newDistance <= 0) {
      alert('La distance doit être un nombre positif.');
      return;
    }

    if (isEditingEdge && edgeToEdit) {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeToEdit.id ? { ...e, label: distance } : e
        )
      );
      setGraphData((prev) =>
        prev.map((data) =>
          (data.source === edgeToEdit.source && data.target === edgeToEdit.target) ||
          (data.source === edgeToEdit.target && data.target === edgeToEdit.source)
            ? { ...data, distance: newDistance }
            : data
        )
      );
    } else {
      setEdges((eds) => addEdge({ ...currentEdge, label: distance }, eds));
      setGraphData((prev) => [
        ...prev,
        { source: currentEdge.source, target: currentEdge.target, distance: newDistance },
        { source: currentEdge.target, target: currentEdge.source, distance: newDistance }, // Arête bidirectionnelle
      ]);
    }

    setModalShow(false);
    setDistance('');
    setIsEditingEdge(false);
    setEdgeToEdit(null);
    recalculatePathIfDisplayed();
  };

  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
  };

  const deleteNode = () => {
    const nodeId = contextMenu.nodeId;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setGraphData((prev) => prev.filter((data) => data.source !== nodeId && data.target !== nodeId));
    setNodeCount((count) => count - 1);
    closeContextMenu();
    recalculatePathIfDisplayed();
  };

  const deleteNodeEdges = () => {
    const nodeId = contextMenu.nodeId;
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setGraphData((prev) => prev.filter((data) => data.source !== nodeId && data.target !== nodeId));
    closeContextMenu();
    recalculatePathIfDisplayed();
  };

  const resetStyles = () => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: defaultNodeStyle,
      }))
    );
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: undefined,
      }))
    );
  };

  const recalculatePathIfDisplayed = () => {
    if (currentPathType && startNode && endNode) {
      resetStyles();
      if (currentPathType === 'short') {
        findShortestPath();
      } else if (currentPathType === 'long') {
        findLongestPath();
      }
    }
  };

  const showShortestPath = () => {
    setShortestPathModal(true);
  };

  const showLongestPath = () => {
    setLongestPathModal(true);
  };

  const dijkstraAlgorithm = (graphData, startNode, endNode) => {
    const distances = {};
    const previousNodes = {};
    const queue = new PriorityQueue();
    const pathEdges = [];

    // Initialisation
    nodes.forEach((node) => {
      distances[node.id] = Infinity;
      previousNodes[node.id] = null;
    });
    distances[startNode] = 0;
    queue.enqueue(startNode, 0);

    while (!queue.isEmpty()) {
      const { element: currentNode } = queue.dequeue();

      if (currentNode === endNode) {
        let current = endNode;
        let totalDistance = distances[endNode];
        while (current && previousNodes[current]) {
          pathEdges.unshift({ source: previousNodes[current], target: current });
          current = previousNodes[current];
        }
        return { path: pathEdges, distance: totalDistance === Infinity ? null : totalDistance };
      }

      const neighbors = graphData.filter(
        (edge) => edge.source === currentNode || edge.target === currentNode
      );

      for (const { source, target, distance } of neighbors) {
        const neighbor = source === currentNode ? target : source;
        const newDist = distances[currentNode] + distance;

        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previousNodes[neighbor] = currentNode;
          queue.enqueue(neighbor, newDist);
        }
      }
    }

    return { path: [], distance: null }; // Aucun chemin trouvé
  };

  const findLongestPathAlgorithm = (graphData, startNode, endNode) => {
    const allPaths = [];
    const visited = new Set();

    const dfs = (currentNode, targetNode, currentPath, currentDistance) => {
      if (currentNode === targetNode) {
        allPaths.push({ path: [...currentPath], distance: currentDistance });
        return;
      }

      const neighbors = graphData.filter(
        (edge) => edge.source === currentNode || edge.target === currentNode
      );

      for (const { source, target, distance } of neighbors) {
        const nextNode = source === currentNode ? target : source;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          currentPath.push({ source: currentNode, target: nextNode });
          dfs(nextNode, targetNode, currentPath, currentDistance + distance);
          currentPath.pop();
          visited.delete(nextNode);
        }
      }
    };

    dfs(startNode, endNode, [], 0);

    if (allPaths.length === 0) return { path: [], distance: null };

    const longestPath = allPaths.reduce(
      (max, path) => (path.distance > max.distance ? path : max),
      { distance: -Infinity, path: [] }
    );

    return longestPath;
  };

  const findShortestPath = () => {
    if (!startNode || !endNode) {
      alert('Veuillez sélectionner un point de départ et un point d’arrivée.');
      return;
    }
    if (startNode === endNode) {
      alert('Le point de départ et d’arrivée doivent être différents.');
      return;
    }

    resetStyles();
    const { path: shortestPathEdges, distance: totalDistance } = dijkstraAlgorithm(graphData, startNode, endNode);

    if (shortestPathEdges.length === 0) {
      alert('Aucun chemin trouvé entre les nœuds sélectionnés.');
      return;
    }

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const isInPath = shortestPathEdges.some(
          (path) => path.source === node.id || path.target === node.id
        );
        return {
          ...node,
          style: {
            ...node.style,
            backgroundColor:
              node.id === startNode
                ? 'yellow'
                : node.id === endNode
                ? 'green'
                : isInPath
                ? 'orange'
                : defaultNodeStyle.backgroundColor,
          },
        };
      })
    );

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const isInPath = shortestPathEdges.some(
          (path) =>
            (path.source === edge.source && path.target === edge.target) ||
            (path.source === edge.target && path.target === edge.source)
        );
        return {
          ...edge,
          style: isInPath ? { stroke: 'orange', strokeWidth: 3 } : undefined,
        };
      })
    );

    setPathDistance(totalDistance);
    setShortestPathModal(false);
    setCurrentPathType('short');
  };

  const findLongestPath = () => {
    if (!startNode || !endNode) {
      alert('Veuillez sélectionner un point de départ et un point d’arrivée.');
      return;
    }
    if (startNode === endNode) {
      alert('Le point de départ et d’arrivée doivent être différents.');
      return;
    }

    resetStyles();
    const { path: longestPathEdges, distance: totalDistance } = findLongestPathAlgorithm(graphData, startNode, endNode);

    if (longestPathEdges.length === 0) {
      alert('Aucun chemin trouvé entre les nœuds sélectionnés.');
      return;
    }

    const pathNodes = [startNode];
    longestPathEdges.forEach(({ source, target }) => {
      if (pathNodes[pathNodes.length - 1] === source) {
        pathNodes.push(target);
      } else if (pathNodes[pathNodes.length - 1] === target) {
        pathNodes.push(source);
      }
    });

    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          backgroundColor: pathNodes.includes(node.id)
            ? node.id === startNode
              ? 'yellow'
              : node.id === endNode
              ? 'green'
              : 'red'
            : defaultNodeStyle.backgroundColor,
        },
      }))
    );

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const isInPath = longestPathEdges.some(
          (path) =>
            (path.source === edge.source && path.target === edge.target) ||
            (path.source === edge.target && path.target === edge.source)
        );
        return {
          ...edge,
          style: isInPath ? { stroke: 'red', strokeWidth: 3 } : undefined,
        };
      })
    );

    setPathDistance(totalDistance);
    setLongestPathModal(false);
    setCurrentPathType('long');
  };

  return (
    <div className="row mx-2 my-4" onClick={closeContextMenu}>
      <div className="col-3 mx-5 border rounded shadow p-5 bg-body">
        <h5>Contrôles</h5>
        <Button variant="primary my-1" onClick={addCircle}>
          Ajouter un cercle
        </Button>
        <br />
        <Button variant="primary my-1" onClick={removeLastCircle}>
          Effacer le dernier cercle
        </Button>
        <br />
        <Button variant="primary my-1" onClick={removeCircle}>
          Effacer tous les cercles
        </Button>
        <br />
        <Button variant="primary my-1" onClick={showShortestPath}>
          Afficher le chemin le plus court
        </Button>
        <br />
        <Button variant="primary my-1" onClick={showLongestPath}>
          Afficher le chemin le plus long
        </Button>
        <br />
        {pathDistance !== null && (
          <div className="mt-3">
            <p>Distance du chemin : {pathDistance}</p>
          </div>
        )}
      </div>

      <div className="col-8">
        <div style={{ width: '100%', height: '60vh' }} className="border shadow bg-body rounded">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            disableKeyboardA11y={true}
          >
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      <div className="border shadow bg-body rounded mt-3 py-2 px-5 mx-5" style={{ width: '94.2%' }}>
        <div style={{ height: '8vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>
            <span style={{ display: 'inline-block', width: '40px', height: '2px', backgroundColor: 'orange', marginRight: '8px' }}></span> : Chemin le plus court
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'green', marginRight: '8px' }}></span> : Point d'arrivée
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'red', marginRight: '8px' }}></span> : Point du chemin le plus long
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid black', marginRight: '8px' }}></span> : Point normal
          </p>
        </div>
        <div style={{ height: '8vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>
            <span style={{ display: 'inline-block', width: '40px', height: '2px', backgroundColor: 'red', marginRight: '8px' }}></span> : Chemin le plus long
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'yellow', marginRight: '8px' }}></span> : Point de départ
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'orange', marginRight: '8px' }}></span> : Point du chemin le plus court
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid black', marginRight: '8px' }}></span> : Point normal
          </p>
        </div>
      </div>

      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingEdge ? 'Modifier la distance' : 'Ajouter une distance'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Distance entre les cercles :</Form.Label>
              <Form.Control
                type="number"
                value={distance}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setDistance(value);
                  }
                }}
                autoFocus
                min="1"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalShow(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveDistance}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={shortestPathModal} onHide={() => setShortestPathModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Choisir le départ et l'arrivée</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Point de départ :</Form.Label>
              <Form.Select value={startNode} onChange={(e) => setStartNode(e.target.value)}>
                <option value="">Sélectionner...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Point d'arrivée :</Form.Label>
              <Form.Select value={endNode} onChange={(e) => setEndNode(e.target.value)}>
                <option value="">Sélectionner...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShortestPathModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={findShortestPath}>
            Calculer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={longestPathModal} onHide={() => setLongestPathModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Choisir le départ et l'arrivée</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Point de départ :</Form.Label>
              <Form.Select value={startNode} onChange={(e) => setStartNode(e.target.value)}>
                <option value="">Sélectionner...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Point d'arrivée :</Form.Label>
              <Form.Select value={endNode} onChange={(e) => setEndNode(e.target.value)}>
                <option value="">Sélectionner...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setLongestPathModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={findLongestPath}>
            Calculer
          </Button>
        </Modal.Footer>
      </Modal>

      {contextMenu.show && (
        <div
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '5px',
            zIndex: 1000,
            width: '10%',
          }}
        >
          <div onClick={deleteNode} style={{ padding: '5px', cursor: 'pointer' }}>
            Effacer ce cercle
          </div>
          <div onClick={deleteNodeEdges} style={{ padding: '5px', cursor: 'pointer' }}>
            Effacer tous les liens
          </div>
        </div>
      )}
    </div>
  );
}