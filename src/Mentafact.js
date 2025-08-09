/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from './auth/AuthContext';
import { FaBell, FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown, FaCreditCard, FaUser, FaSearch, FaChevronRight } from 'react-icons/fa';
import { employeeService } from "./services/employeeService";
import { invoiceService } from "./services/invoiceService";
import { teamService } from "./services/teamService";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
// Import pages and components
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import EmployeesPage from "./pages/EmployeePage";
import StatsPage from "./pages/StatsPage";
import TeamsPage from "./pages/TeamsPage";
import Sidebar from "./pages/Sidebare";
import Preloader from './components/Preloader';
import CompanyNameDisplay from './components/CompanyNameDisplay';

import logo from './assets/Logo_Mf.png';
import "./css/Mentafact.css";
/*import * as XLSX from 'xlsx'; */

const Mentafact = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab_0, setActiveTab_0] = useState("factures");
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);
   // const [, setImportProgress] = useState(""); // Ajouté pour l'import de employees

    const [employee, setEmployee] = useState({
        nom: "",
        prenom: "",
        matricule: "",
        poste: "",
        departement: "",
        dateEmbauche: "",
        typeContrat: "CDI",
        salaireBase: 0
    });
    const [employees, setEmployees] = useState([]);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // eslint-disable-next-line no-unused-vars
    const [isEditing, setIsEditing] = useState(false);

    const [allFactures, setAllFactures] = useState([]);
    const [employeeFactures, ] = useState([]);
    const [allDevis, setAllDevis] = useState([]);
    const [employeeDevis, ] = useState([]);
    const [allAvoirs, setAllAvoirs] = useState([]);
    const [employeeAvoirs, ] = useState([]);

    const [equipe, setEquipe] = useState({ nom: "", description: "", responsable: "" });
    const [equipes, setEquipes] = useState([]);
    const [editingEquipe, setEditingEquipe] = useState(null);
    const [isEditingEquipe, setIsEditingEquipe] = useState(false);
    const { createSubUser, checkPermission } = useAuth();

    const [stats, setStats] = useState({
        totalemployees: 0,
        totalFactures: 0,
        revenusMensuels: 0,
        facturesImpayees: 0,
        facturesPayees: 0,
        totalEquipes: 0,
    });

    const roleLabels = {
        superadmin: "Super Administrateur",
        admin: "Administrateur",
        comptable: "Comptable",
        charge_compte: "Chargé de compte",
        lecteur: "Lecteur",
        user: "Utilisateur"
    };
    useEffect(() => {
        const fetchCompanyId = async () => {
            if (!currentUser) return;

            try {
                let companyIdToSet = currentUser.companyId;
                if (!companyIdToSet) {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        companyIdToSet = userDoc.data().companyId;
                    }
                }
                setCompanyId(companyIdToSet);
                return companyIdToSet;
            } catch (error) {
                console.error("Error fetching companyId:", error);
                setError("Erreur de chargement des informations de l'entreprise");
                return null;
            }
        };

        // Cette fonction gère les abonnements aux données
        const setupDataSubscriptions = async (companyId) => {
            if (!companyId) return;

            const unsubscribers = [];

            // Dans setupDataSubscriptions, remplacez :
            const employeesUnsub = employeeService.getEmployees(companyId, (employeesData) => {
                setEmployees(employeesData);
                setStats(prev => ({
                    ...prev,
                    totalEmployees: employeesData.length
                }));
            });
            if (typeof employeesUnsub === "function") unsubscribers.push(employeesUnsub);

            const invoicesUnsub = invoiceService.getInvoices(companyId, "facture", (invoicesData) => {
                let filteredFactures = invoicesData;
                if (currentUser?.role === "charge_compte") {
                    filteredFactures = invoicesData.filter(f => f.userId === currentUser.uid);
                }
                setAllFactures(filteredFactures);
                setStats(prev => ({
                    ...prev,
                    totalFactures: filteredFactures.length,
                    revenusMensuels: filteredFactures
                        .filter(f => f?.date && new Date(f.date).getMonth() === new Date().getMonth())
                        .reduce((sum, f) => sum + (parseFloat(f?.totalTTC) || 0), 0),
                    facturesImpayees: filteredFactures.filter(f => f.statut === "en attente").length,
                    facturesPayees: filteredFactures.filter(f => f.statut === "payé").length
                }));
            });
            if (typeof invoicesUnsub === "function") unsubscribers.push(invoicesUnsub);

            // Devis
            const devisUnsub = invoiceService.getInvoices(companyId, "devis", (devisData) => {
                let filteredDevis = devisData;
                if (currentUser?.role === "charge_compte") {
                    filteredDevis = devisData.filter(d => d.userId === currentUser.uid);
                }
                setAllDevis(filteredDevis);
                setStats(prev => ({
                    ...prev,
                    totalDevis: filteredDevis.length
                }));
            });
            if (typeof devisUnsub === "function") unsubscribers.push(devisUnsub);

            // Avoirs
            const avoirsUnsub = invoiceService.getInvoices(companyId, "avoir", (avoirsData) => {
                let filteredAvoirs = avoirsData;
                if (currentUser?.role === "charge_compte") {
                    filteredAvoirs = avoirsData.filter(a => a.userId === currentUser.uid);
                }
                setAllAvoirs(filteredAvoirs);
                setStats(prev => ({
                    ...prev,
                    totalAvoirs: filteredAvoirs.length
                }));
            });
            if (typeof avoirsUnsub === "function") unsubscribers.push(avoirsUnsub);

            // Equipes
            const equipesUnsub = teamService.getTeams(companyId, (equipesData) => {
                setEquipes(equipesData);
                setStats(prev => ({
                    ...prev,
                    totalEquipes: equipesData.length
                }));
            });
            if (typeof equipesUnsub === "function") unsubscribers.push(equipesUnsub);

            return () => {
                unsubscribers.forEach(unsub => unsub());
            };
        };


        const loadData = async () => {
            setIsLoading(true);
            try {
                const companyId = await fetchCompanyId();
                if (!companyId) return;

                const unsubscribe = await setupDataSubscriptions(companyId);
                setInitialLoadComplete(true);
                setIsLoading(false);

                return unsubscribe;
            } catch (error) {
                console.error("Error loading data:", error);
                setError("Erreur de chargement des données");
                setIsLoading(false);
            }
        };

        const unsubscribePromise = loadData();

        return () => {
            // Cleanup function
            unsubscribePromise.then(unsubscribe => unsubscribe?.());
        };
    }, [currentUser]);


    // Handlers et fonctions utilitaires...
    // Handlers employees
    // Handlers employés
    const loadEmployeePayrolls = (employeeId) => {
        const employeeObj = employees.find(e => e.id === employeeId);
        setSelectedEmployee(employeeObj);
        // Chargez les bulletins de paie ici
    };
    const handleChange = (e) => setEmployee({ ...employee, [e.target.name]: e.target.value });
    const handleEditChange = (e) => setEditingEmployee({ ...editingEmployee, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await employeeService.addEmployee(companyId, employee);
        if (result.success) {
            alert(result.message);
            setEmployee({
                nom: "",
                prenom: "",
                matricule: "",
                poste: "",
                departement: "",
                dateEmbauche: "",
                typeContrat: "CDI",
                salaireBase: 0
            });
        } else {
            alert(result.message);
        }
    };
    const handleEditEmployee = (client) => {
        setEditingEmployee({ ...client });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            return false;
        }

        try {
            const result = await employeeService.deleteEmployee(companyId, employeeId);
            if (result.success) {
                setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
                alert(result.message);
                return true;
            }
        } catch (error) {
            console.error("Erreur suppression employé:", error);
            alert("Échec de la suppression");
            return false;
        }
    };

    const handleUpdateEmployee = async (e) => {    
        e.preventDefault();
        const result = await employeeService.updateClient(companyId, editingEmployee.id, editingEmployee);
        if (result.success) {
            alert(result.message);
            cancelEditEmployee();
        } else {
            alert(result.message);
        }
    };
    

    // Annuler l'édition d'un client
    const cancelEditEmployee = () => {
        setEditingEmployee(null);
        setIsEditing(false);
    };



    // Handlers équipes
    const handleEquipeChange = (e) => setEquipe({ ...equipe, [e.target.name]: e.target.value });
    const handleEquipeEditChange = (e) => setEditingEquipe({ ...editingEquipe, [e.target.name]: e.target.value });

    const handleEquipeSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await teamService.addTeam(companyId, equipe);
            if (result.success) {
                setEquipes([...equipes, { ...equipe, id: result.id }]);
                setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes + 1 }));
                alert(result.message);
                setEquipe({ nom: "", description: "", responsable: "" });
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout de l'équipe.");
        }
    };

    const handleEquipeUpdate = async (e) => {
        e.preventDefault();
        try {
            const result = await teamService.updateTeam(editingEquipe.id, editingEquipe);
            if (result.success) {
                setEquipes(equipes.map(eq => eq.id === editingEquipe.id ? editingEquipe : eq));
                alert(result.message);
                cancelEquipeEdit();
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la modification de l'équipe.");
        }
    };

    const handleEquipeDelete = async (equipeId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            try {
                const result = await teamService.deleteTeam(equipeId);
                if (result.success) {
                    setEquipes(equipes.filter(eq => eq.id !== equipeId));
                    setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes - 1 }));
                    alert(result.message);
                }
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la suppression de l'équipe.");
            }
        }
    };

    const handleEquipeEdit = (equipe) => {
        setEditingEquipe({ ...equipe });
        setIsEditingEquipe(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Annuler l'édition d'une équipe
    const cancelEquipeEdit = () => {
        setEditingEquipe(null);
        setIsEditingEquipe(false);
    };

    // Handlers factures

    const handleDeleteFacture = async (docId, type) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) {
            try {
                // Supprimer la facture complète
                await deleteDoc(doc(db, `companies/${currentUser.companyId}/factures`, docId));

                // Supprimer le résumé aussi
                await deleteDoc(doc(db, `companies/${currentUser.companyId}/factures_resume`, docId));

                // Mettre à jour l’état local
                setAllFactures(prev => prev.filter(doc => doc.id !== docId));

                alert(`${type} supprimé avec succès`);
                return true;
            } catch (error) {
                console.error("Erreur suppression:", error);
                alert("Échec de la suppression");
                return false;
            }
        }
    };


  /*  const handleCreateInvoice = () => {
        if (!selectedEmployee) {
            alert("Veuillez sélectionner un employee d'abord");
            return;
        }
        navigate("/bill", { state: { employee: selectedEmployee } });
    }; */

    /*  const getLastThreeInvoices = () => [...allFactures]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); */

    // Filtres
    const filteredEmployees = (employees || []).filter(employee =>
        employee.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEquipes = equipes.filter(equipe =>
        equipe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipe.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Déterminer quelles factures afficher selon l'onglet
    const getFacturesToDisplay = () => {
        if (activeTab === "employees" && selectedEmployee) {
            return employeeFactures;
        }
        return allFactures;
    };

    // Fonction pour charger les factures d'un employee sélectionné
  /*  const loademployeeInvoices = (employeeId) => {
        const employeeObj = employees.find(c => c.id === employeeId);
        setSelectedEmployee(employeeObj);

        // Filtrer les factures, devis et avoirs du employee sélectionné
        setemployeeFactures(allFactures.filter(f => f.employeeId === employeeId));
        setemployeeDevis(allDevis.filter(d => d.employeeId === employeeId));
        setemployeeAvoirs(allAvoirs.filter(a => a.employeeId === employeeId));

    }; */

    const getDevisToDisplay = () => {
        if (activeTab === "employees" && selectedEmployee) {
            return employeeDevis;
        }
        return allDevis;
    };

    const getAvoirsToDisplay = () => {
        if (activeTab === "employees" && selectedEmployee) {
            return employeeAvoirs;
        }
        return allAvoirs;
    };
 /*   const handleImportemployee = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportProgress("Début de l'import...");

        try {
            // 1. Lire le fichier Excel
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setImportProgress("Conversion des données...");

            // 2. Transformer les données
            const employeesToImport = jsonData.map(row => ({
                societe: row['Responsable'] || row['Nom'] || '',
                nom: row['Raison sociale'] || row['Société'] || '',
                email: row['Email'] || row['E-mail'] || '',
                telephone: row['Téléphone'] || row['Phone'] || '',
                adresse: row['Adresse'] || row['Address'] || '',
                ville: row['Ville'] || row['City'] || '',
                type: (row['Type'] || 'employee').toLowerCase()
            })).filter(employee => employee.nom.trim() !== '');

            if (employeesToImport.length === 0) {
                setImportProgress("Aucun employee valide trouvé dans le fichier");
                return;
            }

            setImportProgress(`Importation de ${employeesToImport.length} employees...`);

            // 3. Importer les employees
            let importedCount = 0;
            for (const employee of employeesToImport) {
                try {
                    const result = await employeeService.addemployee(companyId, employee);
                    if (result.success) {
                        importedCount++;
                    }
                } catch (error) {
                    console.error("Erreur lors de l'import d'un employee:", error);
                }
            }

            // 4. Mettre à jour la liste des employees
            //   const updatedEmployees = await employeeService.getemployees(companyId);
            // setemployees(updatedEmployees);

            setImportProgress(`${importedCount}/${employeesToImport.length} employees importés avec succès`);

        } catch (error) {
            console.error("Erreur lors de l'import:", error);
            setImportProgress("Erreur lors de l'import: " + error.message);
        } finally {
            // Réinitialiser le champ de fichier
            e.target.value = '';
        }
    }; */

    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardPage
                    stats={stats}
                    allFactures={allFactures}
                    allDevis={allDevis}
                    allAvoirs={allAvoirs}
                    navigate={navigate}
                    employees={employees}
                    currentUser={currentUser} // 👈 Ajoute ça

                />;
            case "employees":
                return <EmployeesPage
                    employees={employees}
                    filteredEmployees={filteredEmployees}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedEmployee={selectedEmployee}
                    loadEmployeePayrolls={loadEmployeePayrolls}
                    handleEdit={handleEditEmployee}
                    handleDelete={handleDeleteEmployee}
                    employee={employee}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    editingEmployee={editingEmployee}
                    handleEditChange={handleEditChange}
                    handleUpdate={handleUpdateEmployee}
                    cancelEdit={cancelEditEmployee}
                />;
            case "factures":
                return <InvoicesPage
                    activeTab_0={activeTab_0}
                    setActiveTab_0={setActiveTab_0}
                    getFacturesToDisplay={getFacturesToDisplay}
                    getDevisToDisplay={getDevisToDisplay}
                    getAvoirsToDisplay={getAvoirsToDisplay}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    handleDeleteFacture={handleDeleteFacture}
                    selectedEmployee={selectedEmployee}
                    companyId={companyId}

                />;
            case "stats":
                return <StatsPage
                    stats={stats}
                    allFactures={allFactures}
                    employees={employees}
                    allDevis={allDevis}
                    allAvoirs={allAvoirs}

                />;
            case "equipes":
                return <TeamsPage
                    filteredEquipes={filteredEquipes}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isEditingEquipe={isEditingEquipe}
                    editingEquipe={editingEquipe}
                    handleEquipeEditChange={handleEquipeEditChange}
                    handleEquipeUpdate={handleEquipeUpdate}
                    cancelEquipeEdit={cancelEquipeEdit}
                    equipe={equipe}
                    handleEquipeChange={handleEquipeChange}
                    handleEquipeSubmit={handleEquipeSubmit}
                    handleEquipeEdit={handleEquipeEdit}
                    handleEquipeDelete={handleEquipeDelete}
                    checkPermission={checkPermission}
                    createSubUser={createSubUser}
                />;
            default:
                return <div>Sélectionnez une section</div>;
        }
    };
    // Ajoutez cette vérification au début du return
    if (isLoading || !initialLoadComplete) {
        return <Preloader message="Sam@Fact ..." />;
    }
    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                logo={logo}

            />


            {/* Main Content */}
            <div className="main-content">
                {/* Navbar Premium */}
                <header className="navbar-premium">
                    <div className="navbar-left">
                        <div className="company-brand">
                            <div className="navbar-left">
                                <CompanyNameDisplay companyId={companyId} currentUser={currentUser} />
                            </div>
                        </div>

                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher employees, factures..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="search-shortcut">⌘K</div>
                        </div>
                    </div>

                    <div className="navbar-right">
                        <button className="notification-btn">
                            <FaBell />
                            <span className="notification-badge pulse">3</span>
                        </button>

                        <div className="user-profile-dropdown">
                            <div className="user-profile-trigger">
                                <div className="user-avatar-wrapper">
                                    <FaUserCircle className="user-avatar" />
                                    <div className="user-status"></div>
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{currentUser?.name || "Admin"}</span>
                                    <span className="user-role">{roleLabels[currentUser?.role] || "Rôle inconnu"}</span>
                                </div>
                                <FaChevronDown className="dropdown-arrow" />
                            </div>

                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <div className="user-avatar-wrapper large">
                                        <FaUserCircle className="user-avatar" />
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{currentUser?.name || "Admin"}</span>
                                        <span className="user-email">{currentUser?.email || "admin@entreprise.com"}</span>
                                    </div>
                                </div>

                                <Link to="/profile" className="dropdown-item">
                                    <FaUser className="dropdown-icon" />
                                    <span> Profil</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>
                                <Link to="/settings" className="dropdown-item">
                                    <FaCog className="dropdown-icon" />
                                    <span>Paramètres</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>
                                <Link to="/billing" className="dropdown-item">
                                    <FaCreditCard className="dropdown-icon" />
                                    <span>Abonnement</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>

                                <div className="dropdown-divider"></div>

                                <button className="dropdown-item logout-btn" onClick={() => logout()}>
                                    <FaSignOutAlt className="dropdown-icon" />
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-container">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
};

export default Mentafact;