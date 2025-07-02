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
    const [currentPathType, setCurrentPathType] = useState(null); // "short" ou "long" pour suivre le type de chemin affiché

    // Style par défaut pour les nœuds
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
        border: '2px solid black'
    };

    // Générer une étiquette pour les nœuds (A, B, C, ..., AA, AB, etc.)
    const generateLabel = (index) => {
        if (index < 26) return alphabet[index];
        return alphabet[index % 26] + Math.floor(index / 26);
    };

    // Ajouter un nouveau cercle
    const addCircle = () => {
        const newId = (nodeCount + 1).toString();
        const newNode = {
            id: newId,
            position: { x: Math.random() * 300, y: Math.random() * 300 },
            data: { label: generateLabel(nodeCount) },
            style: defaultNodeStyle,
            sourcePosition: 'right',
            targetPosition: 'left'
        };
        setNodes((prevNodes) => [...prevNodes, newNode]);
        setNodeCount(nodeCount + 1);
    };

    // Supprimer tous les cercles
    const removeCircle = () => {
        setNodes([]);
        setEdges([]);
        setNodeCount(0);
        setGraphData([]);
        setCurrentPathType(null); // Réinitialiser le type de chemin
    };

    // Supprimer le dernier cercle
    const removeLastCircle = () => {
        if (nodes.length === 0) return;
        const lastNode = nodes[nodes.length - 1].id;
        setNodes((nds) => nds.filter((n) => n.id !== lastNode));
        setEdges((eds) => eds.filter((e) => e.source !== lastNode && e.target !== lastNode));
        setGraphData((prev) => prev.filter((data) => data.source !== lastNode && data.target !== lastNode));
        setNodeCount(nodeCount - 1);
        recalculatePathIfDisplayed(); // Recalculer le chemin si affiché
    };

    // Connecter deux nœuds (nouvelle arête)
    const onConnect = useCallback((params) => {
        setCurrentEdge(params);
        setIsEditingEdge(false);
        setModalShow(true);
    }, []);

    // Modifier une arête existante
    const onEdgeClick = (event, edge) => {
        setEdgeToEdit(edge);
        setDistance(edge.label);
        setIsEditingEdge(true);
        setModalShow(true);
    };

    // Sauvegarder la distance (ajout ou modification)
    const handleSaveDistance = () => {
        if (distance.trim() === '') {
            setModalShow(false);
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
                    data.source === edgeToEdit.source && data.target === edgeToEdit.target
                        ? { ...data, distance: parseInt(distance, 10) }
                        : data
                )
            );
        } else {
            setEdges((eds) => addEdge({ ...currentEdge, label: distance }, eds));
            setGraphData((prev) => [
                ...prev,
                { source: currentEdge.source, target: currentEdge.target, distance: parseInt(distance, 10) },
            ]);
        }

        setModalShow(false);
        setDistance('');
        setIsEditingEdge(false);
        setEdgeToEdit(null);
        recalculatePathIfDisplayed(); // Recalculer le chemin après modification
    };

    // Afficher le menu contextuel au clic droit
    const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        setContextMenu({
            show: true,
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id,
        });
    };

    // Fermer le menu contextuel
    const closeContextMenu = () => {
        setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
    };

    // Supprimer un nœud et ses arêtes
    const deleteNode = () => {
        const nodeId = contextMenu.nodeId;
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        setGraphData((prev) => prev.filter((data) => data.source !== nodeId && data.target !== nodeId));
        setNodeCount((count) => count - 1);
        closeContextMenu();
        recalculatePathIfDisplayed(); // Recalculer le chemin après suppression
    };

    // Supprimer toutes les arêtes d'un nœud
    const deleteNodeEdges = () => {
        const nodeId = contextMenu.nodeId;
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        setGraphData((prev) => prev.filter((data) => data.source !== nodeId && data.target !== nodeId));
        closeContextMenu();
        recalculatePathIfDisplayed(); // Recalculer le chemin après suppression
    };

    // Réinitialiser les styles des nœuds et arêtes à leur état par défaut
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
                style: undefined, // Supprimer les styles personnalisés
            }))
        );
    };

    // Recalculer le chemin affiché s'il existe
    const recalculatePathIfDisplayed = () => {
        if (currentPathType && startNode && endNode) {
            resetStyles(); // Réinitialiser les styles avant recalcul
            if (currentPathType === "short") {
                findShortestPath();
            } else if (currentPathType === "long") {
                findLongestPath();
            }
        }
    };

    // Afficher le modal pour le chemin le plus court
    const showShortestPath = () => {
        setShortestPathModal(true);
    };

    // Afficher le modal pour le chemin le plus long
    const showLongestPath = () => {
        setLongestPathModal(true);
    };

    // Algorithme de Dijkstra
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
        } else if (path === "long") {
            graphData.forEach(({ source, target }) => {
                distances[source] = -Infinity;
                distances[target] = -Infinity;
                unvisitedNodes.add(source);
                unvisitedNodes.add(target);
            });

            distances[startNode] = 0;

            while (unvisitedNodes.size > 0) {
                let currentNode = null;
                let maxDistance = -Infinity;

                unvisitedNodes.forEach(node => {
                    if (distances[node] > maxDistance) {
                        maxDistance = distances[node];
                        currentNode = node;
                    }
                });

                if (!currentNode || distances[currentNode] === -Infinity) break;

                unvisitedNodes.delete(currentNode);

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
        }

        let current = endNode;
        while (current !== startNode && previousNodes[current]) {
            pathEdges.push({ source: previousNodes[current], target: current });
            current = previousNodes[current];
        }

        return pathEdges;
    };

    // Calculer et afficher le chemin le plus court
    const findShortestPath = () => {
        if (!startNode || !endNode) {
            alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
            return;
        }

        resetStyles(); // Réinitialiser les styles avant de recalculer
        const shortestPathEdges = dijkstraAlgorithm(graphData, startNode, endNode, "short");

        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                shortestPathEdges.some(
                    (path) => path.source === node.id || path.target === node.id
                )
                    ? { ...node, style: { ...node.style, backgroundColor: "orange" } }
                    : node
            )
        );

        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === startNode
                    ? { ...node, style: { ...node.style, backgroundColor: "yellow" } }
                    : node.id === endNode
                    ? { ...node, style: { ...node.style, backgroundColor: "green" } }
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
        setCurrentPathType("short"); // Enregistrer que le chemin court est affiché
    };

    // Calculer et afficher le chemin le plus long
    const findLongestPath = () => {
        if (!startNode || !endNode) {
            alert("Veuillez sélectionner un point de départ et un point d'arrivée.");
            return;
        }

        resetStyles(); // Réinitialiser les styles avant de recalculer
        const longestPathEdges = dijkstraAlgorithm(graphData, startNode, endNode, "long");

        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                longestPathEdges.some(
                    (path) => path.source === node.id || path.target === node.id
                )
                    ? { ...node, style: { ...node.style, backgroundColor: "red" } }
                    : node
            )
        );

        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === startNode
                    ? { ...node, style: { ...node.style, backgroundColor: "yellow" } }
                    : node.id === endNode
                    ? { ...node, style: { ...node.style, backgroundColor: "green" } }
                    : node
            )
        );

        setEdges((prevEdges) =>
            prevEdges.map((edge) =>
                longestPathEdges.some(
                    (path) => (path.source === edge.source && path.target === edge.target) ||
                              (path.source === edge.target && path.target === edge.source)
                )
                    ? { ...edge, style: { stroke: "red", strokeWidth: 3 } }
                    : edge
            )
        );

        setLongestPathModal(false);
        setCurrentPathType("long"); // Enregistrer que le chemin long est affiché
    };

    // Rendu du composant
    return (
        <div className="row mx-2 my-4" onClick={closeContextMenu}>
            <div className="col-3 mx-5 border rounded shadow p-5 bg-body">
                <h5>Contrôles</h5>
                <Button variant="primary my-1" onClick={addCircle}>Ajouter un cercle</Button><br />
                <Button variant="primary my-1" onClick={removeLastCircle}>Effacer le dernier cercle</Button><br />
                <Button variant="primary my-1" onClick={removeCircle}>Effacer tous les cercles</Button><br />
                <Button variant="primary my-1" onClick={showShortestPath}>Afficher le chemin plus court</Button><br />
                <Button variant="primary my-1" onClick={showLongestPath}>Afficher le chemin plus long</Button><br />
            </div>

            <div className="col-8">
                <div style={{ width: '100%', height: '60vh' }} className='border shadow bg-body rounded'>
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
                    <p><span style={{ display: 'inline-block', width: '40px', height: '2px', backgroundColor: 'orange', marginRight: '8px' }}></span> : Chemin le plus court</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'green', marginRight: '8px' }}></span> : Point d'arrivée</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'red', marginRight: '8px' }}></span> : Point du chemin plus long</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid black', marginRight: '8px' }}></span> : Point normal</p>
                </div>
                <div style={{ height: '8vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p><span style={{ display: 'inline-block', width: '40px', height: '2px', backgroundColor: 'red', marginRight: '8px' }}></span> : Chemin le plus long</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'yellow', marginRight: '8px' }}></span> : Point de départ</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'orange', marginRight: '8px' }}></span> : Point du chemin plus court</p>
                    <p><span style={{ display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid black', marginRight: '8px' }}></span> : Point normal</p>
                </div>
            </div>

            <Modal show={modalShow} onHide={() => setModalShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditingEdge ? "Modifier la distance" : "Ajouter une distance"}</Modal.Title>
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
                    }}
                >
                    <div
                        onClick={deleteNode}
                        style={{ padding: '5px', cursor: 'pointer' }}
                    >
                        Effacer ce cercle
                    </div>
                    <div
                        onClick={deleteNodeEdges}
                        style={{ padding: '5px', cursor: 'pointer' }}
                    >
                        Effacer tous les liens
                    </div>
                </div>
            )}
        </div>
    );
}