package main

import (
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/net/html/charset"
)

type PDMModel struct {
	FilePath string     `json:"filePath"`
	Name     string     `json:"name"`
	Code     string     `json:"code"`
	Tables   []PDMTable `json:"tables"`
	Summary  PDMSummary `json:"summary"`
	Warnings []string   `json:"warnings,omitempty"`
}

type PDMSummary struct {
	TableCount     int `json:"tableCount"`
	ColumnCount    int `json:"columnCount"`
	ReferenceCount int `json:"referenceCount"`
	IndexCount     int `json:"indexCount"`
}

type PDMTable struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Code        string          `json:"code"`
	Comment     string          `json:"comment,omitempty"`
	Columns     []PDMColumn     `json:"columns"`
	PrimaryKeys []string        `json:"primaryKeys,omitempty"`
	ForeignKeys []PDMForeignKey `json:"foreignKeys,omitempty"`
	Indexes     []PDMIndex      `json:"indexes,omitempty"`
}

type PDMColumn struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Code         string `json:"code"`
	DataType     string `json:"dataType,omitempty"`
	Length       string `json:"length,omitempty"`
	Precision    string `json:"precision,omitempty"`
	Scale        string `json:"scale,omitempty"`
	Mandatory    bool   `json:"mandatory"`
	Comment      string `json:"comment,omitempty"`
	IsPrimaryKey bool   `json:"isPrimaryKey"`
	IsForeignKey bool   `json:"isForeignKey"`
}

type PDMForeignKey struct {
	ID            string      `json:"id"`
	Name          string      `json:"name"`
	Code          string      `json:"code"`
	ParentTableID string      `json:"parentTableId,omitempty"`
	ChildTableID  string      `json:"childTableId,omitempty"`
	ParentTable   string      `json:"parentTable,omitempty"`
	ChildTable    string      `json:"childTable,omitempty"`
	Joins         []PDMFKJoin `json:"joins,omitempty"`
}

type PDMFKJoin struct {
	ParentColumnID string `json:"parentColumnId,omitempty"`
	ChildColumnID  string `json:"childColumnId,omitempty"`
	ParentColumn   string `json:"parentColumn,omitempty"`
	ChildColumn    string `json:"childColumn,omitempty"`
}

type PDMIndex struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Code      string   `json:"code"`
	Unique    bool     `json:"unique"`
	ColumnIDs []string `json:"columnIds,omitempty"`
	Columns   []string `json:"columns,omitempty"`
}

type xmlNode struct {
	Name     string
	Attrs    map[string]string
	Text     string
	Children []*xmlNode
}

type pdmParser struct {
	model           *PDMModel
	tableByID       map[string]*PDMTable
	columnByID      map[string]*PDMColumn
	columnTableByID map[string]*PDMTable
	keyColumnsByID  map[string][]string
}

func ParsePDM(path string) (*PDMModel, error) {
	if strings.TrimSpace(path) == "" {
		return nil, errors.New("请选择要解析的 PDM 文件")
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("无法打开文件: %w", err)
	}
	defer file.Close()

	root, err := parseXMLTree(file)
	if err != nil {
		return nil, fmt.Errorf("无法解析 XML: %w", err)
	}

	parser := &pdmParser{
		model: &PDMModel{
			FilePath: path,
			Name:     strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)),
		},
		tableByID:       map[string]*PDMTable{},
		columnByID:      map[string]*PDMColumn{},
		columnTableByID: map[string]*PDMTable{},
		keyColumnsByID:  map[string][]string{},
	}

	parser.parse(root)
	if len(parser.model.Tables) == 0 {
		return nil, errors.New("未在文件中找到 PowerDesigner 表结构")
	}

	return parser.model, nil
}

func parseXMLTree(reader io.Reader) (*xmlNode, error) {
	decoder := xml.NewDecoder(reader)
	decoder.CharsetReader = charset.NewReaderLabel
	root := &xmlNode{Name: "Document", Attrs: map[string]string{}}
	stack := []*xmlNode{root}

	for {
		token, err := decoder.Token()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, err
		}

		switch value := token.(type) {
		case xml.StartElement:
			node := &xmlNode{
				Name:  value.Name.Local,
				Attrs: map[string]string{},
			}
			for _, attr := range value.Attr {
				node.Attrs[attr.Name.Local] = attr.Value
			}
			parent := stack[len(stack)-1]
			parent.Children = append(parent.Children, node)
			stack = append(stack, node)
		case xml.CharData:
			text := strings.TrimSpace(string(value))
			if text != "" {
				current := stack[len(stack)-1]
				if current.Text == "" {
					current.Text = text
				} else {
					current.Text += " " + text
				}
			}
		case xml.EndElement:
			if len(stack) > 1 {
				stack = stack[:len(stack)-1]
			}
		}
	}

	return root, nil
}

func (p *pdmParser) parse(root *xmlNode) {
	modelNode := findFirst(root, "Model")
	if modelNode == nil {
		modelNode = root
	}

	if name := textChild(modelNode, "Name"); name != "" {
		p.model.Name = name
	}
	p.model.Code = textChild(modelNode, "Code")

	p.parseTables(modelNode)
	p.rebuildIndexes()
	p.parseReferences(modelNode)
	p.model.Summary.TableCount = len(p.model.Tables)
	for _, table := range p.model.Tables {
		p.model.Summary.ColumnCount += len(table.Columns)
		p.model.Summary.IndexCount += len(table.Indexes)
		p.model.Summary.ReferenceCount += len(table.ForeignKeys)
	}
}

func (p *pdmParser) parseTables(modelNode *xmlNode) {
	tablesNode := findCollection(modelNode, "Tables")
	if tablesNode == nil {
		return
	}

	for _, tableNode := range directChildren(tablesNode, "Table") {
		table := PDMTable{
			ID:      attr(tableNode, "Id"),
			Name:    textChild(tableNode, "Name"),
			Code:    textChild(tableNode, "Code"),
			Comment: firstNonEmpty(textChild(tableNode, "Comment"), textChild(tableNode, "Description")),
		}
		if table.Name == "" {
			table.Name = firstNonEmpty(table.Code, table.ID)
		}
		if table.Code == "" {
			table.Code = table.Name
		}

		p.parseColumns(tableNode, &table)
		p.parseKeys(tableNode, &table)
		p.parseIndexes(tableNode, &table)

		p.model.Tables = append(p.model.Tables, table)
		tablePtr := &p.model.Tables[len(p.model.Tables)-1]
		if tablePtr.ID != "" {
			p.tableByID[tablePtr.ID] = tablePtr
		}
		for i := range tablePtr.Columns {
			column := &tablePtr.Columns[i]
			if column.ID != "" {
				p.columnByID[column.ID] = column
				p.columnTableByID[column.ID] = tablePtr
			}
		}
	}
}

func (p *pdmParser) rebuildIndexes() {
	p.tableByID = map[string]*PDMTable{}
	p.columnByID = map[string]*PDMColumn{}
	p.columnTableByID = map[string]*PDMTable{}
	for tableIndex := range p.model.Tables {
		table := &p.model.Tables[tableIndex]
		if table.ID != "" {
			p.tableByID[table.ID] = table
		}
		for columnIndex := range table.Columns {
			column := &table.Columns[columnIndex]
			if column.ID != "" {
				p.columnByID[column.ID] = column
				p.columnTableByID[column.ID] = table
			}
		}
	}
}

func (p *pdmParser) parseColumns(tableNode *xmlNode, table *PDMTable) {
	columnsNode := directChild(tableNode, "Columns")
	if columnsNode == nil {
		return
	}

	for _, columnNode := range directChildren(columnsNode, "Column") {
		column := PDMColumn{
			ID:        attr(columnNode, "Id"),
			Name:      textChild(columnNode, "Name"),
			Code:      textChild(columnNode, "Code"),
			DataType:  textChild(columnNode, "DataType"),
			Length:    textChild(columnNode, "Length"),
			Precision: textChild(columnNode, "Precision"),
			Scale:     textChild(columnNode, "Scale"),
			Mandatory: parseBool(textChild(columnNode, "Mandatory")),
			Comment:   firstNonEmpty(textChild(columnNode, "Comment"), textChild(columnNode, "Description")),
		}
		if column.Name == "" {
			column.Name = firstNonEmpty(column.Code, column.ID)
		}
		if column.Code == "" {
			column.Code = column.Name
		}
		table.Columns = append(table.Columns, column)
	}
}

func (p *pdmParser) parseKeys(tableNode *xmlNode, table *PDMTable) {
	keysNode := directChild(tableNode, "Keys")
	if keysNode != nil {
		for _, keyNode := range directChildren(keysNode, "Key") {
			keyID := attr(keyNode, "Id")
			if keyID == "" {
				continue
			}
			columnIDs := collectRefsToTableColumns(keyNode, table)
			p.keyColumnsByID[keyID] = columnIDs
		}
	}

	primaryKeyNode := directChild(tableNode, "PrimaryKey")
	if primaryKeyNode == nil {
		return
	}

	keyID := firstRef(primaryKeyNode, "Key")
	columnIDs := p.keyColumnsByID[keyID]
	if len(columnIDs) == 0 {
		columnIDs = collectRefsToTableColumns(primaryKeyNode, table)
	}

	seen := map[string]bool{}
	for _, columnID := range columnIDs {
		if columnID == "" || seen[columnID] {
			continue
		}
		seen[columnID] = true
		table.PrimaryKeys = append(table.PrimaryKeys, columnID)
		markTableColumn(table, columnID, func(column *PDMColumn) {
			column.IsPrimaryKey = true
		})
	}
}

func (p *pdmParser) parseIndexes(tableNode *xmlNode, table *PDMTable) {
	indexesNode := directChild(tableNode, "Indexes")
	if indexesNode == nil {
		return
	}

	for _, indexNode := range directChildren(indexesNode, "Index") {
		index := PDMIndex{
			ID:     attr(indexNode, "Id"),
			Name:   textChild(indexNode, "Name"),
			Code:   textChild(indexNode, "Code"),
			Unique: parseBool(textChild(indexNode, "Unique")),
		}
		if index.Name == "" {
			index.Name = firstNonEmpty(index.Code, index.ID)
		}
		if index.Code == "" {
			index.Code = index.Name
		}

		for _, columnID := range collectRefsToTableColumns(indexNode, table) {
			column := findColumnInTable(table, columnID)
			if column == nil {
				continue
			}
			index.ColumnIDs = appendUnique(index.ColumnIDs, columnID)
			index.Columns = appendUnique(index.Columns, firstNonEmpty(column.Code, column.Name))
		}

		table.Indexes = append(table.Indexes, index)
	}
}

func (p *pdmParser) parseReferences(modelNode *xmlNode) {
	for _, referencesNode := range findAll(modelNode, "References") {
		for _, referenceNode := range directChildren(referencesNode, "Reference") {
			fk := PDMForeignKey{
				ID:            attr(referenceNode, "Id"),
				Name:          textChild(referenceNode, "Name"),
				Code:          textChild(referenceNode, "Code"),
				ParentTableID: firstRef(directChild(referenceNode, "ParentTable"), "Table"),
				ChildTableID:  firstRef(directChild(referenceNode, "ChildTable"), "Table"),
			}
			if fk.Name == "" {
				fk.Name = firstNonEmpty(fk.Code, fk.ID)
			}
			if fk.Code == "" {
				fk.Code = fk.Name
			}

			parentTable := p.tableByID[fk.ParentTableID]
			childTable := p.tableByID[fk.ChildTableID]
			if parentTable != nil {
				fk.ParentTable = firstNonEmpty(parentTable.Code, parentTable.Name)
			}
			if childTable != nil {
				fk.ChildTable = firstNonEmpty(childTable.Code, childTable.Name)
			}

			fk.Joins = p.parseReferenceJoins(referenceNode)
			if childTable == nil {
				p.model.Warnings = append(p.model.Warnings, fmt.Sprintf("外键 %s 未能解析子表", firstNonEmpty(fk.Name, fk.ID)))
				continue
			}

			childTable.ForeignKeys = append(childTable.ForeignKeys, fk)
			for _, join := range fk.Joins {
				if join.ChildColumnID == "" {
					continue
				}
				markTableColumn(childTable, join.ChildColumnID, func(column *PDMColumn) {
					column.IsForeignKey = true
				})
			}
		}
	}
}

func (p *pdmParser) parseReferenceJoins(referenceNode *xmlNode) []PDMFKJoin {
	var joins []PDMFKJoin
	joinNodes := findAll(referenceNode, "ReferenceJoin")
	if len(joinNodes) == 0 {
		joinNodes = findAll(referenceNode, "Join")
	}

	for _, joinNode := range joinNodes {
		join := PDMFKJoin{
			ParentColumnID: firstNonEmpty(
				firstRef(directChild(joinNode, "Object1"), "Column"),
				firstRef(directChild(joinNode, "ParentColumn"), "Column"),
			),
			ChildColumnID: firstNonEmpty(
				firstRef(directChild(joinNode, "Object2"), "Column"),
				firstRef(directChild(joinNode, "ChildColumn"), "Column"),
			),
		}
		if parentColumn := p.columnByID[join.ParentColumnID]; parentColumn != nil {
			join.ParentColumn = firstNonEmpty(parentColumn.Code, parentColumn.Name)
		}
		if childColumn := p.columnByID[join.ChildColumnID]; childColumn != nil {
			join.ChildColumn = firstNonEmpty(childColumn.Code, childColumn.Name)
		}
		if join.ParentColumnID != "" || join.ChildColumnID != "" {
			joins = append(joins, join)
		}
	}

	if len(joins) > 0 {
		return joins
	}

	refs := collectColumnRefs(referenceNode)
	for i := 0; i+1 < len(refs); i += 2 {
		join := PDMFKJoin{ParentColumnID: refs[i], ChildColumnID: refs[i+1]}
		if parentColumn := p.columnByID[join.ParentColumnID]; parentColumn != nil {
			join.ParentColumn = firstNonEmpty(parentColumn.Code, parentColumn.Name)
		}
		if childColumn := p.columnByID[join.ChildColumnID]; childColumn != nil {
			join.ChildColumn = firstNonEmpty(childColumn.Code, childColumn.Name)
		}
		joins = append(joins, join)
	}
	return joins
}

func findCollection(node *xmlNode, name string) *xmlNode {
	for _, child := range node.Children {
		if child.Name == name {
			return child
		}
	}
	return findFirst(node, name)
}

func findFirst(node *xmlNode, name string) *xmlNode {
	if node == nil {
		return nil
	}
	if node.Name == name {
		return node
	}
	for _, child := range node.Children {
		if found := findFirst(child, name); found != nil {
			return found
		}
	}
	return nil
}

func findAll(node *xmlNode, name string) []*xmlNode {
	if node == nil {
		return nil
	}
	var results []*xmlNode
	if node.Name == name {
		results = append(results, node)
	}
	for _, child := range node.Children {
		results = append(results, findAll(child, name)...)
	}
	return results
}

func directChild(node *xmlNode, name string) *xmlNode {
	if node == nil {
		return nil
	}
	for _, child := range node.Children {
		if child.Name == name {
			return child
		}
	}
	return nil
}

func directChildren(node *xmlNode, name string) []*xmlNode {
	if node == nil {
		return nil
	}
	var results []*xmlNode
	for _, child := range node.Children {
		if child.Name == name {
			results = append(results, child)
		}
	}
	return results
}

func textChild(node *xmlNode, name string) string {
	child := directChild(node, name)
	if child == nil {
		return ""
	}
	return strings.TrimSpace(child.Text)
}

func attr(node *xmlNode, name string) string {
	if node == nil {
		return ""
	}
	return strings.TrimSpace(node.Attrs[name])
}

func firstRef(node *xmlNode, targetName string) string {
	if node == nil {
		return ""
	}
	if node.Name == targetName {
		if ref := attr(node, "Ref"); ref != "" {
			return ref
		}
	}
	for _, child := range node.Children {
		if ref := firstRef(child, targetName); ref != "" {
			return ref
		}
	}
	return ""
}

func collectRefsToTableColumns(node *xmlNode, table *PDMTable) []string {
	if node == nil || table == nil {
		return nil
	}
	valid := map[string]bool{}
	for _, column := range table.Columns {
		valid[column.ID] = true
	}
	var refs []string
	var walk func(*xmlNode)
	walk = func(current *xmlNode) {
		if current.Name == "Column" {
			ref := attr(current, "Ref")
			if valid[ref] {
				refs = appendUnique(refs, ref)
			}
		}
		for _, child := range current.Children {
			walk(child)
		}
	}
	walk(node)
	return refs
}

func collectColumnRefs(node *xmlNode) []string {
	if node == nil {
		return nil
	}
	var refs []string
	var walk func(*xmlNode)
	walk = func(current *xmlNode) {
		if current.Name == "Column" {
			if ref := attr(current, "Ref"); ref != "" {
				refs = append(refs, ref)
			}
		}
		for _, child := range current.Children {
			walk(child)
		}
	}
	walk(node)
	return refs
}

func markTableColumn(table *PDMTable, columnID string, update func(*PDMColumn)) {
	for i := range table.Columns {
		if table.Columns[i].ID == columnID {
			update(&table.Columns[i])
			return
		}
	}
}

func findColumnInTable(table *PDMTable, columnID string) *PDMColumn {
	for i := range table.Columns {
		if table.Columns[i].ID == columnID {
			return &table.Columns[i]
		}
	}
	return nil
}

func parseBool(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "y", "yes":
		return true
	default:
		return false
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func appendUnique(values []string, value string) []string {
	if value == "" {
		return values
	}
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}
