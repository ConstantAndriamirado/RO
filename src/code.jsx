import '@xyflow/react/dist/style.css';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { Button, Modal, Form } from 'react-bootstrap';

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
    const [startNode, setStartNode] = useState('');
    const [endNode, setEndNode] = useState('');



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
            style: {
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#6800ff',
                fontSize: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                border: '2px solid black'
            },
            sourcePosition: 'right',
            targetPosition: 'left'
        };

        setNodes((prevNodes) => [...prevNodes, newNode]);
        setNodeCount(nodeCount + 1);
    };

    const removeCircle = () => {
        setNodes([]);
        setEdges([]);
        setNodeCount(0);
    };

    const removeLastCircle = () => {
        if (nodes.length === 0) return;
    
        const lastNode = nodes[nodes.length - 1].id;
    
        const newEdges = edges.filter(edge => edge.source !== lastNode && edge.target !== lastNode);
    
        const newNodes = nodes.slice(0, -1);
    
        setNodes(newNodes);
        setEdges(newEdges);
        setNodeCount(nodeCount - 1);
    };

    const onConnect = useCallback((params) => {
        setCurrentEdge(params);
        setModalShow(true);
    }, []);

    const handleSaveDistance = () => {
        if (distance.trim() === '') {
            setModalShow(false);
            return;
        }

        setEdges((eds) => addEdge({ ...currentEdge, label: distance }, eds));
        setGraphData((prev) => [...prev, { source: currentEdge.source, target: currentEdge.target, distance: parseInt(distance, 10) }]);
        setModalShow(false);
        setDistance('');
        console.log(graphData);
    };

    useEffect(() => {
        console.log("GraphData mis à jour :", graphData);
    }, [graphData]);

    const showShortestPath = () => {
        setShortestPathModal(true);
    };

    const resetNodeColors = () => {
        const resetStyle = { backgroundColor: '#6800ff' }; // couleur par défaut
        setNodes(nodes.map(node => ({
            ...node,
            style: { ...node.style, ...resetStyle } // réinitialiser la couleur des nœuds
        })));
    };
    
    const resetEdgeColors = () => {
        const resetStyle = { stroke: '#000' }; // couleur par défaut des arêtes
        setEdges(edges.map(edge => ({
            ...edge,
            style: { ...edge.style, ...resetStyle } // réinitialiser la couleur des arêtes
        })));
    };

    const colorShortestPath = (shortestPathNodes, shortestPathEdges) => {
        // Colorier les nœuds du chemin en orange
        setNodes(nodes.map(node => ({
            ...node,
            style: {
                ...node.style,
                backgroundColor: shortestPathNodes.includes(node.id) ? 'orange' : node.style.backgroundColor
            }
        })));
    
        // Colorier les arêtes du chemin en orange
        setEdges(edges.map(edge => ({
            ...edge,
            style: {
                ...edge.style,
                stroke: shortestPathEdges.includes(edge.id) ? 'orange' : edge.style.stroke
            }
        })));
    };
    
    

    const dijkstraAlgorithm = (graphData, startNode, endNode) => {
        resetNodeColors();  // Réinitialiser les couleurs des nœuds
        resetEdgeColors();  // Réinitialiser les couleurs des arêtes
    
        // Initialisation des structures
        const distances = {};  // Distance minimale depuis startNode
        const previousNodes = {};  // Prédécesseur pour reconstruire le chemin
        const unvisitedNodes = new Set();  // File à priorité simulée
        const shortestPathEdges = [];  // Liste des arêtes du chemin final
        const shortestPathNodes = new Set(); // Nouveau Set pour stocker les nœuds du chemin le plus court
    
        // Initialisation des distances et de la file
        graphData.forEach(({ source, target }) => {
            distances[source] = Infinity;
            distances[target] = Infinity;
            unvisitedNodes.add(source);
            unvisitedNodes.add(target);
        });
    
        distances[startNode] = 0; // La distance à soi-même est 0
    
        while (unvisitedNodes.size > 0) {
            // Trouver le nœud non visité avec la plus petite distance
            let currentNode = null;
            let minDistance = Infinity;
    
            unvisitedNodes.forEach(node => {
                if (distances[node] < minDistance) {
                    minDistance = distances[node];
                    currentNode = node;
                }
            });
    
            if (!currentNode || distances[currentNode] === Infinity) break; // Si inatteignable, stop
    
            unvisitedNodes.delete(currentNode);
    
            // Vérifier les voisins
            graphData.forEach(({ source, target, distance }) => {
                if (source === currentNode && unvisitedNodes.has(target)) {
                    const newDist = distances[currentNode] + distance;
                    if (newDist < distances[target]) {
                        distances[target] = newDist;
                        previousNodes[target] = currentNode;
                    }
                }
                if (target === currentNode && unvisitedNodes.has(source)) {
                    const newDist = distances[currentNode] + distance;
                    if (newDist < distances[source]) {
                        distances[source] = newDist;
                        previousNodes[source] = currentNode;
                    }
                }
            });
        }
    
        // Reconstruction du chemin le plus court
        let current = endNode;
        while (current !== startNode && previousNodes[current]) {
            shortestPathEdges.push({ source: previousNodes[current], target: current });
            shortestPathNodes.add(current); // Ajouter le nœud au chemin
            current = previousNodes[current];
        }
        shortestPathNodes.add(startNode); // Ajouter le nœud de départ au chemin
    
        // Colorier le chemin le plus court
        colorShortestPath([...shortestPathNodes], shortestPathEdges);
        return shortestPathEdges.reverse(); 
    };
    

    

    const findShortestPath = () => {
        if (!startNode || !endNode) {
            alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
            return;
        }

        setShortestPathModal(false);
    
        setNodes((prevNodes) =>
            prevNodes.map((node) => 
                node.id === startNode || node.id === endNode
                    ? { ...node, style: { ...node.style, backgroundColor: "yellow" } }
                    : node
            )
        );
    
        const shortestPathEdges = dijkstraAlgorithm(graphData, startNode, endNode);
    
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                shortestPathEdges.includes(node.id)
                    ? { ...node, style: { ...node.style, backgroundColor: "orange" } }
                    : node
            )
        );
    
        setEdges((prevEdges) =>
            prevEdges.map((edge) =>
                shortestPathEdges.some(
                    (path) => (path.source === edge.source && path.target === edge.target) ||
                              (path.source === edge.target && path.target === edge.source)
                )
                    ? { ...edge, style: { stroke: "orange", strokeWidth: 3 } }
                    : edge
            )
        );
    
        setShortestPathModal(false);
    };
    
    

    return (
        <div className="row m-5">
            <div className="col-3 mx-5 border rounded shadow p-5 bg-body">
                <h5>Contrôles</h5>
                <Button variant="primary my-1" onClick={addCircle}>Ajouter un cercle</Button>
                <Button variant="primary my-1" onClick={removeLastCircle}>Effacer le dernier cercle</Button>
                <Button variant="primary my-1" onClick={removeCircle}>Effacer tous les cercles</Button>
                <Button variant="primary my-1" onClick={showShortestPath}>Afficher le chemin plus court</Button>
                
            </div>

            <div className="col-8 border shadow bg-body rounded">
                <div style={{ width: '100%', height: '70vh' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                    >
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>
            </div>

            <Modal show={modalShow} onHide={() => setModalShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter une distance</Modal.Title>
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
                                    if (/^\d+$/.test(value) && parseInt(value, 10) > 0) {
                                        setDistance(value);
                                    }
                                }}
                                autoFocus
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setModalShow(false)}>Annuler</Button>
                    <Button variant="primary" onClick={handleSaveDistance}>Enregistrer</Button>
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
                                    <option key={node.id} value={node.id}>{node.data.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mt-3">
                            <Form.Label>Point d'arrivée :</Form.Label>
                            <Form.Select value={endNode} onChange={(e) => setEndNode(e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {nodes.map((node) => (
                                    <option key={node.id} value={node.id}>{node.data.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShortestPathModal(false)}>Annuler</Button>
                    <Button variant="primary" onClick={() => findShortestPath()}>Calculer</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
