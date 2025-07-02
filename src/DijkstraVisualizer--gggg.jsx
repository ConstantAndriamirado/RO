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
    const [longestPathModal, setLongestPathModal] = useState(false);
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
                backgroundColor: 'white',
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
    };

    useEffect(() => {
        console.log("GraphData mis à jour :", graphData);
    }, [graphData]);

    const showShortestPath = () => {
        setShortestPathModal(true);
    };
    const showLongestPath = () => {
        setLongestPathModal(true);
    }



    ///////////////////////////////////     ALGORITHME DIJKSTRA     //////////////////////////////////////////

    const dijkstraAlgorithm = (graphData, startNode, endNode, path) => {
        const distances = {};  
        const previousNodes = {};  
        const unvisitedNodes = new Set();  
        const pathEdges = [];
        
        if (path === "short") {
            graphData.forEach(({ source, target }) => {
                distances[source] = Infinity;
                distances[target] = Infinity;
                unvisitedNodes.add(source);
                unvisitedNodes.add(target);
            });
            
            
            distances[startNode] = 0; 
        
            while (unvisitedNodes.size > 0) {
                let currentNode = null;
                let minDistance = Infinity;
        
                unvisitedNodes.forEach(node => {
                    if (distances[node] < minDistance) {
                        minDistance = distances[node];
                        currentNode = node;
                    }
                });
                console.log("Unvisited Nodes boucle : " + unvisitedNodes);
                console.log("Min distance boucle : " + minDistance);
        
                if (!currentNode || distances[currentNode] === Infinity) break;
        
                unvisitedNodes.delete(currentNode);
        
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
        
            let current = endNode;
            while (current !== startNode && previousNodes[current]) {
                pathEdges.push({ source: previousNodes[current], target: current });
                current = previousNodes[current];
            }
        } else if (path === "long") {
            graphData.forEach(({ source, target }) => {
                distances[source] = 0;
                distances[target] = 0;
                unvisitedNodes.add(source);
                unvisitedNodes.add(target);
            });

            console.log("______Graph______");
            graphData.forEach((data) => console.log(data));
            console.log("_______Distances_______");
            console.log(distances);
            console.log("______Unvisited Nodes_____");
            console.log(unvisitedNodes);
            
            distances[startNode] = Infinity; 
        
            while (unvisitedNodes.size > 0) {
                let currentNode = null;
                let maxDistance = 0;
        
                unvisitedNodes.forEach(node => {
                    console.log("hay : " + distances[node]);
                    if (distances[node] > maxDistance) {
                        maxDistance = distances[node];
                        currentNode = node;
                        console.log('Ato ehh !');
                        console.log(maxDistance);
                    }
                });
        
                if (!currentNode || distances[currentNode] === 0) break;
                console.log('Hmm !');
        
                unvisitedNodes.delete(currentNode);

                console.log("Unvisited Nodes boucle : " + unvisitedNodes);
                console.log("Max distance boucle : " + maxDistance);
        
                graphData.forEach(({ source, target, distance }) => {
                    if (source === currentNode && unvisitedNodes.has(target)) {
                        const newDist = distances[currentNode] + distance;
                        if (newDist > distances[target]) {
                            distances[target] = newDist;
                            previousNodes[target] = currentNode;
                        }
                    }
                    if (target === currentNode && unvisitedNodes.has(source)) {
                        const newDist = distances[currentNode] + distance;
                        if (newDist > distances[source]) {
                            distances[source] = newDist;
                            previousNodes[source] = currentNode;
                        }
                    }
                });
            }
        
            let current = endNode;
            while (current !== startNode && previousNodes[current]) {
                pathEdges.push({ source: previousNodes[current], target: current });
                current = previousNodes[current];
            }
        }
        
        return pathEdges;
    };

    const findShortestPath = () => {
        if (!startNode || !endNode) {
            alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
            return;
        }
    
        const shortestPathEdges = dijkstraAlgorithm(graphData, startNode, endNode, "short");
    
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                shortestPathEdges.some(
                    (path) => path.source === node.id || path.target === node.id
                )
                    ? { ...node, style: { ...node.style, backgroundColor: "orange" } } // Chemin en orange
                    : node
            )
        );
   
        // Mise à jour des couleurs des noeuds de départ et d'arrivée
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === startNode
                    ? { ...node, style: { ...node.style, backgroundColor: "yellow" } } // Point de départ en jaune
                    : node.id === endNode
                    ? { ...node, style: { ...node.style, backgroundColor: "green" } } // Point d'arrivée en vert
                    : node
            )
        );
    
        setEdges((prevEdges) =>
            prevEdges.map((edge) =>
                shortestPathEdges.some(
                    (path) => (path.source === edge.source && path.target === edge.target) ||
                              (path.source === edge.target && path.target === edge.source)
                )
                    ? { ...edge, style: { stroke: "orange", strokeWidth: 3 } } // Lien orange
                    : edge
            )
        );
    
        setShortestPathModal(false);
    };
    const findLongestPath = () => {
        if (!startNode || !endNode) {
            alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
            return;
        }
    
        const longestPathEdges = dijkstraAlgorithm(graphData, startNode, endNode, "long");
    
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                longestPathEdges.some(
                    (path) => path.source === node.id || path.target === node.id
                )
                    ? { ...node, style: { ...node.style, backgroundColor: "orange" } } // Chemin en orange
                    : node
            )
        );
   
        // Mise à jour des couleurs des noeuds de départ et d'arrivée
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === startNode
                    ? { ...node, style: { ...node.style, backgroundColor: "yellow" } } // Point de départ en jaune
                    : node.id === endNode
                    ? { ...node, style: { ...node.style, backgroundColor: "green" } } // Point d'arrivée en vert
                    : node
            )
        );
    
        setEdges((prevEdges) =>
            prevEdges.map((edge) =>
                longestPathEdges.some(
                    (path) => (path.source === edge.source && path.target === edge.target) ||
                              (path.source === edge.target && path.target === edge.source)
                )
                    ? { ...edge, style: { stroke: "red", strokeWidth: 3 } } // Lien orange
                    : edge
            )
        );
    
        setLongestPathModal(false);
    };
    

    return (
        <div className="row mx-2 my-4">
            <div className="col-3 mx-5 border rounded shadow p-5 bg-body">
                <h5>Contrôles</h5>
                <Button variant="primary my-1" onClick={addCircle}>Ajouter un cercle</Button>
                <Button variant="primary my-1" onClick={removeLastCircle}>Effacer le dernier cercle</Button>
                <Button variant="primary my-1" onClick={removeCircle}>Effacer tous les cercles</Button>
                <Button variant="primary my-1" onClick={showShortestPath}>Afficher le chemin plus court</Button>
                <Button variant="primary my-1" onClick={showLongestPath}>Afficher le chemin plus long</Button>
            </div>

            <div className="col-8">
                <div style={{ width: '100%', height: '65vh' }} className='border shadow bg-body rounded'>
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
            <div className="border shadow bg-body rounded mt-3 py-2 px-5 mx-5" style={{ width: '94.2%', height: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p><span style={{ display: 'inline-block', width: '60px', height: '2px', backgroundColor: 'orange', marginRight: '8px' }}></span> : Chemin le plus court</p>
                <p><span style={{ display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'green', marginRight: '8px' }}></span> : Point d'arrivée</p>
                <p><span style={{ display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'yellow', marginRight: '8px' }}></span> : Point de départ</p>
                <p><span style={{ display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid black', marginRight: '8px' }}></span> : Point normal</p>
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
                    <Button variant="secondary" onClick={() => setLongestPathModal(false)}>Annuler</Button>
                    <Button variant="primary" onClick={() => findLongestPath()}>Calculer</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}