import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import PayrollPDF from './PayrollPDF';
import './Payroll.css';
import { useAuth } from '../auth/AuthContext';

const PayrollForm = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    // États pour le formulaire de paie
    const [formData, setFormData] = useState({
        periode: {
            du: new Date().toISOString().split('T')[0],
            au: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        },
        remuneration: {
            tauxHoraire: '',
            salaireBase: '',
            sursalaire: '0',
            indemniteDeplacement: '0',
            autresIndemnites: '0',
            avantagesNature: '0'
        },
        primes: {
            transport: '26000',
            panier: '0',
            responsabilite: '0',
            autresPrimes: '0'
        },
        retenues: {
            ipm: '0',
            avances: '0',
            trimf: '300'
        }
    });

    const [calculations, setCalculations] = useState({
        brutSocial: 0,
        brutFiscal: 0,
        cotisationsSalariales: 0,
        cotisationsPatronales: 0,
        salaireNet: 0,
        salaireNetAPayer: 0
    });

    // Récupérer les employés depuis Firestore avec la structure companies/{companyId}/employees
    useEffect(() => {
        const fetchEmployees = async () => {
            if (!currentUser?.companyId) return;

            try {
                const employeesRef = collection(db, `companies/${currentUser.companyId}/employees`);
                const querySnapshot = await getDocs(employeesRef);
                const employeesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEmployees(employeesData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching employees: ", error);
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [currentUser?.companyId]);

    // Mettre à jour le salaire de base quand l'employé est sélectionné
    useEffect(() => {
        if (selectedEmployeeId) {
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
            if (selectedEmployee) {
                setFormData(prev => ({
                    ...prev,
                    remuneration: {
                        ...prev.remuneration,
                        salaireBase: selectedEmployee.salaireBase || '',
                        tauxHoraire: (selectedEmployee.salaireBase / 173.33).toFixed(2) // 173.33 heures/mois
                    }
                }));
            }
        }
    }, [selectedEmployeeId, employees]);

    // Calculs automatiques
    useEffect(() => {
        const calculatePayroll = () => {
            const salaireBase = parseFloat(formData.remuneration.salaireBase) || 0;
            const sursalaire = parseFloat(formData.remuneration.sursalaire) || 0;
            const indemniteDeplacement = parseFloat(formData.remuneration.indemniteDeplacement) || 0;
            const autresIndemnites = parseFloat(formData.remuneration.autresIndemnites) || 0;
            const avantagesNature = parseFloat(formData.remuneration.avantagesNature) || 0;

            const transport = parseFloat(formData.primes.transport) || 0;
            const panier = parseFloat(formData.primes.panier) || 0;
            const responsabilite = parseFloat(formData.primes.responsabilite) || 0;
            const autresPrimes = parseFloat(formData.primes.autresPrimes) || 0;

            const ipm = parseFloat(formData.retenues.ipm) || 0;
            const avances = parseFloat(formData.retenues.avances) || 0;
            const trimf = parseFloat(formData.retenues.trimf) || 0;

            // Calculs
            const brutSocial = salaireBase + sursalaire + indemniteDeplacement + autresIndemnites;
            const brutFiscal = brutSocial + avantagesNature;

            // Cotisations salariales (IPRES RG 5.6%, RC 2.4%)
            const ipresRG = brutSocial * 0.056;
            const ipresRC = brutSocial * 0.024;
            const totalCotisationsSalariales = ipresRG + ipresRC + trimf;

            // Cotisations patronales (IPRES RG 8.4%, RC 3.6%, Allocation Fam. 7%, Acc. Travail 1%)
            const ipresRGP = brutSocial * 0.084;
            const ipresRCP = brutSocial * 0.036;
            const allocationFamiliale = 63000 * 0.07; // Plafond de 63,000
            const accidentTravail = 63000 * 0.01;
            const totalCotisationsPatronales = ipresRGP + ipresRCP + allocationFamiliale + accidentTravail + ipm;

            // Salaire net avant impôt
            const salaireNet = brutSocial - totalCotisationsSalariales - ipm - avances;

            // Salaire net à payer (avec primes non imposables)
            const primesNonImposables = transport + panier + responsabilite + autresPrimes;
            const salaireNetAPayer = salaireNet + primesNonImposables;

            setCalculations({
                brutSocial,
                brutFiscal,
                cotisationsSalariales: totalCotisationsSalariales,
                cotisationsPatronales: totalCotisationsPatronales,
                salaireNet,
                salaireNetAPayer,
                detailsCotisations: {
                    ipresRG,
                    ipresRC,
                    ipresRGP,
                    ipresRCP,
                    allocationFamiliale,
                    accidentTravail,
                    trimf,
                    ipm
                }
            });
        };

        calculatePayroll();
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [section, field] = name.split('.');

        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleEmployeeChange = (e) => {
        setSelectedEmployeeId(e.target.value);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };


    if (loading) {
        return (
            <div
                style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#2c3e50',
                    fontSize: '18px',
                    fontWeight: '500',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    margin: '40px auto',
                    marginTop: '15%',
                    maxWidth: '400px'
                }}
            >
                <div
                    style={{
                        fontSize: '30px',
                        marginBottom: '10px',
                        animation: 'spin 1.5s linear infinite',
                        display: 'inline-block'
                    }}
                >
                    ⏳
                </div>
                <div>Chargement...</div>

                <style>
                    {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
                </style>
            </div>
        );
    }

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || {};

    return (
        <div className="payroll-container">
            <h1>Bulletin de Paie</h1>

            <div className="form-section">
                <h2>Sélection de l'employé</h2>
                <div className="form-group">
                    <label>Employé:</label>
                    <select
                        value={selectedEmployeeId}
                        onChange={handleEmployeeChange}
                        className="form-input"
                        required
                    >
                        <option value="">Sélectionner un employé</option>
                        {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                                {employee.nom} {employee.prenom} - {employee.poste} (Mat: {employee.matricule})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedEmployeeId && (
                    <div className="employee-info">
                        <h3>Informations de l'employé</h3>
                        <p><strong>Nom:</strong> {selectedEmployee.nom} {selectedEmployee.prenom}</p>
                        <p><strong>Poste:</strong> {selectedEmployee.poste}</p>
                        <p><strong>Matricule:</strong> {selectedEmployee.matricule}</p>
                        <p><strong>Date d'embauche:</strong> {selectedEmployee.dateEmbauche}</p>
                        <p><strong>Salaire de base:</strong> {formatCurrency(selectedEmployee.salaireBase)}</p>
                        <p><strong>Type de contrat:</strong> {selectedEmployee.typeContrat}</p>
                    </div>
                )}
            </div>

            <div className="form-section">
                <h2>Période de Paie</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Du:</label>
                        <input
                            type="date"
                            name="periode.du"
                            value={formData.periode.du}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Au:</label>
                        <input
                            type="date"
                            name="periode.au"
                            value={formData.periode.au}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2>Rémunération</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Taux horaire:</label>
                        <input
                            type="number"
                            name="remuneration.tauxHoraire"
                            value={formData.remuneration.tauxHoraire}
                            onChange={handleChange}
                            step="0.01"
                        />
                    </div>
                    <div className="form-group">
                        <label>Salaire de base:</label>
                        <input
                            type="number"
                            name="remuneration.salaireBase"
                            value={formData.remuneration.salaireBase}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Sursalaire:</label>
                        <input
                            type="number"
                            name="remuneration.sursalaire"
                            value={formData.remuneration.sursalaire}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Indemnité de déplacement:</label>
                        <input
                            type="number"
                            name="remuneration.indemniteDeplacement"
                            value={formData.remuneration.indemniteDeplacement}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Autres indemnités:</label>
                        <input
                            type="number"
                            name="remuneration.autresIndemnites"
                            value={formData.remuneration.autresIndemnites}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Avantages en nature:</label>
                        <input
                            type="number"
                            name="remuneration.avantagesNature"
                            value={formData.remuneration.avantagesNature}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2>Primes et Indemnités</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Indemnité de transport:</label>
                        <input
                            type="number"
                            name="primes.transport"
                            value={formData.primes.transport}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Prime de panier:</label>
                        <input
                            type="number"
                            name="primes.panier"
                            value={formData.primes.panier}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Indemnité de responsabilité:</label>
                        <input
                            type="number"
                            name="primes.responsabilite"
                            value={formData.primes.responsabilite}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Autres primes:</label>
                        <input
                            type="number"
                            name="primes.autresPrimes"
                            value={formData.primes.autresPrimes}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2>Retenues</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Retenue IPM:</label>
                        <input
                            type="number"
                            name="retenues.ipm"
                            value={formData.retenues.ipm}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Avances:</label>
                        <input
                            type="number"
                            name="retenues.avances"
                            value={formData.retenues.avances}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>TRIMF:</label>
                        <input
                            type="number"
                            name="retenues.trimf"
                            value={formData.retenues.trimf}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>


            {selectedEmployeeId && (
                <div className="calculations-section">
                    <h2>Calculs Automatiques</h2>
                    <div className="calculations-grid">
                        <div className="calculation-item">
                            <span>Brut Social:</span>
                            <span>{formatCurrency(calculations.brutSocial)}</span>
                        </div>
                        <div className="calculation-item">
                            <span>Brut Fiscal:</span>
                            <span>{formatCurrency(calculations.brutFiscal)}</span>
                        </div>
                        <div className="calculation-item">
                            <span>Cotisations Salariales:</span>
                            <span>{formatCurrency(calculations.cotisationsSalariales)}</span>
                        </div>
                        <div className="calculation-item">
                            <span>Cotisations Patronales:</span>
                            <span>{formatCurrency(calculations.cotisationsPatronales)}</span>
                        </div>
                        <div className="calculation-item">
                            <span>Salaire Net:</span>
                            <span>{formatCurrency(calculations.salaireNet)}</span>
                        </div>
                        <div className="calculation-item highlight">
                            <span>Salaire Net à Payer:</span>
                            <span>{formatCurrency(calculations.salaireNetAPayer)}</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedEmployeeId && (
                <div className="actions-section">
                    <PDFDownloadLink
                        document={
                            <PayrollPDF
                                employee={selectedEmployee}
                                formData={formData}
                                calculations={calculations}
                                companyInfo={{
                                    name: "LEADER INTERIM & SERVICES",
                                    address: "Ouest Foire, Parcelle N°1, Route de l'aéroport, Dakar",
                                    phone: "33-820-88-46 / 78-434-30-16",
                                    email: "infos@leaderinterime.com",
                                    rc: "SN 2015 B24288",
                                    ninea: "0057262212 A2"
                                }}
                            />
                        }
                        fileName={`bulletin_paie_${selectedEmployee.nom}_${selectedEmployee.prenom}_${formData.periode.du}_${formData.periode.au}.pdf`}
                    >
                        {({ loading }) => (
                            <button className="download-btn" disabled={loading}>
                                {loading ? 'Génération du PDF...' : 'Télécharger le Bulletin'}
                            </button>
                        )}
                    </PDFDownloadLink>
                </div>
            )}
        </div>
    );
};

export default PayrollForm;