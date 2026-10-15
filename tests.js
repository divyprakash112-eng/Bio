
"use strict";

const TESTS = [
  { id: 1, date: "2026-10-20", type: "chapter", category: "Botany", title: "Cell: The Unit of Life", syllabus: "Cell theory; prokaryotic and eukaryotic cells; cell membrane; endomembrane system; mitochondria, plastids, ribosomes, cytoskeleton and nucleus." },
  { id: 2, date: "2026-10-23", type: "chapter", category: "Zoology", title: "Structural Organisation in Animals", syllabus: "Animal tissues; morphology and anatomy of earthworm, cockroach and frog." },
  { id: 3, date: "2026-10-26", type: "chapter", category: "Botany", title: "Cell Cycle and Cell Division", syllabus: "Cell-cycle phases; mitosis; meiosis; significance of mitosis and meiosis." },
  { id: 4, date: "2026-10-29", type: "chapter", category: "Zoology", title: "Breathing and Exchange of Gases", syllabus: "Respiratory organs; breathing; gas exchange and transport; regulation of respiration; respiratory disorders." },

  { id: 5, date: "2026-11-01", type: "chapter", category: "Botany", title: "The Living World", syllabus: "What is living; diversity; taxonomic categories and aids; nomenclature and systematics." },
  { id: 6, date: "2026-11-04", type: "chapter", category: "Zoology", title: "Body Fluids and Circulation", syllabus: "Blood and lymph; blood groups; coagulation; circulatory system; cardiac cycle; ECG; double circulation." },
  { id: 7, date: "2026-11-07", type: "chapter", category: "Botany", title: "Biological Classification", syllabus: "Monera, Protista, Fungi, Plantae and Animalia; viruses, viroids and lichens." },
  { id: 8, date: "2026-11-10", type: "chapter", category: "Zoology", title: "Excretory Products and their Elimination", syllabus: "Human excretory system; urine formation; tubular reabsorption and secretion; kidney regulation; micturition and disorders." },
  { id: 9, date: "2026-11-13", type: "chapter", category: "Botany", title: "Plant Kingdom", syllabus: "Algae, bryophytes, pteridophytes, gymnosperms and angiosperms; life cycles and alternation of generations." },
  { id: 10, date: "2026-11-16", type: "chapter", category: "Zoology", title: "Locomotion and Movement", syllabus: "Types of movement; skeletal muscle and contraction; skeletal system; joints; muscular and skeletal disorders." },
  { id: 11, date: "2026-11-19", type: "chapter", category: "Botany", title: "Morphology of Flowering Plants", syllabus: "Root, stem, leaf, inflorescence, flower, fruit, seed and typical flowering-plant description." },
  { id: 12, date: "2026-11-22", type: "chapter", category: "Zoology", title: "Neural Control and Coordination", syllabus: "Neurons; neural system; human nervous system; reflex action; sensory reception; eye and ear." },
  { id: 13, date: "2026-11-25", type: "mixed", category: "Mixed", title: "Mixed Biology Test 1", syllabus: "Cell: The Unit of Life; Structural Organisation in Animals; Cell Cycle and Cell Division; Breathing and Exchange of Gases; The Living World; Body Fluids and Circulation." },
  { id: 14, date: "2026-11-29", type: "mixed", category: "Mixed", title: "Mixed Biology Test 2", syllabus: "Tests 1–12 completed chapters, including Biological Classification, Plant Kingdom, Excretory Products and their Elimination, Locomotion and Movement, Morphology of Flowering Plants and Neural Control and Coordination." },

  { id: 15, date: "2026-12-02", type: "chapter", category: "Botany", title: "Anatomy of Flowering Plants", syllabus: "Meristematic and permanent tissues; tissue systems; dicot and monocot roots, stems and leaves; secondary growth." },
  { id: 16, date: "2026-12-05", type: "chapter", category: "Zoology", title: "Chemical Coordination and Integration", syllabus: "Endocrine glands and hormones; hypothalamus, pituitary, thyroid, adrenal, pancreas, gonads and hormone action." },
  { id: 17, date: "2026-12-08", type: "chapter", category: "Botany", title: "Respiration in Plants", syllabus: "Glycolysis; fermentation; aerobic respiration; Krebs cycle; electron transport; amphibolic pathway; respiratory quotient." },
  { id: 18, date: "2026-12-11", type: "chapter", category: "Zoology", title: "Animal Kingdom", syllabus: "Basis of classification; animal groups from Porifera to Chordata and distinguishing features." },
  { id: 19, date: "2026-12-14", type: "chapter", category: "Botany", title: "Photosynthesis in Higher Plants", syllabus: "Experiments; site and pigments; light reaction; photophosphorylation; Calvin cycle; C4 pathway; photorespiration." },
  { id: 20, date: "2026-12-17", type: "chapter", category: "Zoology", title: "Biomolecules", syllabus: "Chemical composition of living tissues; metabolites; proteins, carbohydrates, lipids, nucleic acids, enzymes and cofactors." },
  { id: 21, date: "2026-12-20", type: "chapter", category: "Botany", title: "Plant Growth and Development", syllabus: "Growth and development; differentiation; plant growth regulators; photoperiodism and vernalisation." },
  { id: 22, date: "2026-12-23", type: "chapter", category: "Zoology", title: "Human Reproduction", syllabus: "Male and female reproductive systems; gametogenesis; menstrual cycle; fertilisation; pregnancy; development; parturition and lactation." },
  { id: 23, date: "2026-12-26", type: "mixed", category: "Mixed", title: "Mixed Biology Test 3", syllabus: "Anatomy of Flowering Plants; Chemical Coordination and Integration; Respiration in Plants; Animal Kingdom; Photosynthesis in Higher Plants; Biomolecules; Plant Growth and Development; Human Reproduction, with selected earlier chapters." },
  { id: 24, date: "2026-12-30", type: "mixed", category: "Mixed", title: "Mixed Biology Test 4", syllabus: "Cumulative revision of completed chapters from Tests 1–22, including cell biology, classification, plant and animal kingdoms, physiology, biomolecules and reproduction." },

  { id: 25, date: "2027-01-02", type: "chapter", category: "Botany", title: "Sexual Reproduction in Flowering Plants", syllabus: "Flower structure; pre-fertilisation events; pollination; double fertilisation; post-fertilisation events; apomixis and polyembryony." },
  { id: 26, date: "2027-01-05", type: "chapter", category: "Zoology", title: "Reproductive Health", syllabus: "Reproductive health; birth control; population stabilisation; MTP; STIs; infertility and assisted reproductive technologies." },
  { id: 27, date: "2027-01-08", type: "chapter", category: "Botany", title: "Molecular Basis of Inheritance", syllabus: "DNA and RNA; genetic material; DNA replication; transcription; genetic code; translation; gene expression; genome project; DNA fingerprinting." },
  { id: 28, date: "2027-01-11", type: "chapter", category: "Zoology", title: "Human Health and Disease", syllabus: "Common diseases and pathogens; immunity; AIDS; cancer; drug and alcohol abuse." },
  { id: 29, date: "2027-01-14", type: "chapter", category: "Botany", title: "Principles of Inheritance and Variation", syllabus: "Mendelian inheritance; chromosomal theory; linkage; recombination; sex determination; mutations; pedigree analysis; genetic disorders." },
  { id: 30, date: "2027-01-17", type: "chapter", category: "Zoology", title: "Biotechnology: Principles and Processes", syllabus: "Principles and tools of biotechnology; recombinant DNA technology and its processes." },
  { id: 31, date: "2027-01-20", type: "chapter", category: "Botany", title: "Microbes in Human Welfare", syllabus: "Microbes in household and industrial products; sewage treatment; biogas; biocontrol agents and biofertilisers." },
  { id: 32, date: "2027-01-23", type: "chapter", category: "Zoology", title: "Biotechnology and its Applications", syllabus: "Biotechnology in agriculture and medicine; transgenic animals and ethical issues." },
  { id: 33, date: "2027-01-26", type: "mixed", category: "Mixed", title: "Mixed Biology Test 5", syllabus: "Sexual Reproduction in Flowering Plants; Molecular Basis of Inheritance; Human Reproduction; Principles of Inheritance and Variation; Reproductive Health; Human Health and Disease, plus selected earlier chapters." },
  { id: 34, date: "2027-01-30", type: "mixed", category: "Mixed", title: "Mixed Biology Test 6", syllabus: "Molecular Basis of Inheritance; Microbes in Human Welfare; Principles of Inheritance and Variation; Human Health and Disease; Biotechnology and reproduction chapters, with selected earlier questions." },

  { id: 35, date: "2027-02-02", type: "chapter", category: "Botany", title: "Organisms and Populations", syllabus: "Organism and environment; abiotic factors; environmental responses; adaptations; population attributes, growth and interactions." },
  { id: 36, date: "2027-02-08", type: "chapter", category: "Zoology", title: "Evolution", syllabus: "Origin of life; evidence for evolution; adaptive radiation; theories; Hardy-Weinberg principle; human evolution." },
  { id: 37, date: "2027-02-14", type: "chapter", category: "Botany", title: "Ecosystem", syllabus: "Ecosystem structure and function; productivity; decomposition; energy flow; ecological pyramids; succession; nutrient cycling and services." },
  { id: 38, date: "2027-02-20", type: "chapter", category: "Botany", title: "Biodiversity and Conservation", syllabus: "Biodiversity and its patterns; biodiversity loss; conservation of biodiversity." },
  { id: 39, date: "2027-02-24", type: "mixed", category: "Mixed", title: "Mixed Biology Test 7", syllabus: "Organisms and Populations; Ecosystem; Biodiversity and Conservation; Evolution; selected genetics, reproduction and human physiology questions." },
  { id: 40, date: "2027-02-28", type: "mixed", category: "Mixed", title: "Mixed Biology Test 8", syllabus: "Cumulative revision of all 32 chapter-wise tests across Botany, Zoology, physiology, cell biology, diversity, reproduction, genetics, evolution, health, biotechnology and ecology." },

  { id: 41, date: "2027-03-07", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 1", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 42, date: "2027-03-14", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 2", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 43, date: "2027-03-21", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 3", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 44, date: "2027-03-28", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 4", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 45, date: "2027-04-04", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 5", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 46, date: "2027-04-10", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 6", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 47, date: "2027-04-16", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 7", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 48, date: "2027-04-21", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 8", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 49, date: "2027-04-26", type: "full", category: "Full Syllabus", title: "Full Syllabus Biology Mock 9", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." },
  { id: 50, date: "2027-04-30", type: "full", category: "Full Syllabus", title: "Final Full Syllabus Biology Mock", syllabus: "Complete applicable NEET Biology syllabus: Botany and Zoology." }
];

if (TESTS.length !== 50) {
  console.error("NEET AARAMBH schedule should contain exactly 50 tests.");
}
