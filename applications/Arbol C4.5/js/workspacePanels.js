const panelConfig = {
    tree: {
        panelId: "treePanel",
        variableName: "--tree-size",
        expandedSize: "1.35fr",
        collapsedLabel: "Expandir árbol de decisión",
        expandedLabel: "Minimizar árbol de decisión",
        collapsedText: "TREE"
    },
    dataset: {
        panelId: "datasetPanel",
        variableName: "--dataset-size",
        expandedSize: "1fr",
        collapsedLabel: "Expandir tabla del dataset",
        expandedLabel: "Minimizar tabla del dataset",
        collapsedText: "DATA"
    },
    calculations: {
        panelId: "calculationPanel",
        variableName: "--calculations-size",
        expandedSize: "1.15fr",
        collapsedLabel: "Expandir tabla de cálculos",
        expandedLabel: "Minimizar tabla de cálculos",
        collapsedText: "CALC"
    }
};

export function initWorkspacePanels(onLayoutChange) {
    const workspace = document.getElementById("simulatorWorkspace");
    if (!workspace) return;

    Object.entries(panelConfig).forEach(([panelName, config]) => {
        const button = document.querySelector(`[data-toggle-panel="${panelName}"]`);
        if (!button) return;
        button.addEventListener("click", () => togglePanel(workspace, panelName, onLayoutChange));
        updateButton(button, config, false);
    });

    workspace.addEventListener("transitionend", event => {
        if (event.propertyName === "grid-template-columns") {
            onLayoutChange?.();
        }
    });
}

function togglePanel(workspace, panelName, onLayoutChange) {
    const config = panelConfig[panelName];
    const panel = document.getElementById(config.panelId);
    const button = document.querySelector(`[data-toggle-panel="${panelName}"]`);
    if (!panel || !button) return;

    const isCollapsed = panel.classList.contains("is-collapsed");
    if (!isCollapsed && getExpandedPanelsCount() === 1) return;

    panel.classList.toggle("is-collapsed");
    const nowCollapsed = panel.classList.contains("is-collapsed");

    workspace.style.setProperty(config.variableName, nowCollapsed ? "52px" : config.expandedSize);
    updateButton(button, config, nowCollapsed);
    onLayoutChange?.();
}

function getExpandedPanelsCount() {
    return document.querySelectorAll(".workspace-panel:not(.is-collapsed)").length;
}

function updateButton(button, config, collapsed) {
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", collapsed ? config.collapsedLabel : config.expandedLabel);
    button.textContent = collapsed ? "◂" : "▸";
    button.title = collapsed ? config.collapsedLabel : config.expandedLabel;

    const panel = document.getElementById(config.panelId);
    const title = panel?.querySelector(".panel-title");
    if (title) {
        title.textContent = collapsed ? config.collapsedText : title.dataset.fullTitle || title.textContent;
        title.dataset.fullTitle ||= title.textContent;
    }
}
