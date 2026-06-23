# Implementation Plan - Scrape and Translate 'Black-box and White-box Testing' Quiz Questions

We will apply our established data pipeline to extract, structure, and translate all quiz questions across the 4 modules of the new Coursera course: **Black-box and White-box Testing**.

## Proposed Directory Structure

We will create a new directory `black_box_white_box_testing` inside the workspace:
* `d:\caodata\data-sample\black_box_white_box_testing/`
  * `module_1.json`
  * `module_2.json`
  * `module_3.json`
  * `module_4.json`

---

## Glossary of Terms (Black-box & White-box Testing Context)

The translation pipeline will use the following standard software testing terminology:

| English Term | Vietnamese Translation |
|---|---|
| **Black-box testing** | Kiểm thử hộp đen (Black-box testing) |
| **White-box testing** | Kiểm thử hộp trắng (White-box testing) |
| **Boundary Value Analysis (BVA)** | Phân tích giá trị biên (Boundary Value Analysis) |
| **Equivalence Partitioning (EP)** | Phân vùng tương đương (Equivalence Partitioning) |
| **Decision Table testing** | Kiểm thử bảng quyết định (Decision Table testing) |
| **State Transition testing** | Kiểm thử chuyển đổi trạng thái (State Transition testing) |
| **Use Case testing** | Kiểm thử ca sử dụng (Use Case testing) |
| **Statement coverage** | Độ phủ câu lệnh (Statement coverage) |
| **Branch coverage / Decision coverage** | Độ phủ nhánh / Độ phủ quyết định (Branch/Decision coverage) |
| **Condition coverage** | Độ phủ điều kiện (Condition coverage) |
| **Path coverage** | Độ phủ đường đi (Path coverage) |
| **Modified Condition/Decision Coverage (MC/DC)** | Độ phủ điều kiện/quyết định sửa đổi (MC/DC) |
| **Control Flow Graph (CFG)** | Đồ thị dòng điều khiển (Control Flow Graph - CFG) |
| **Data Flow testing** | Kiểm thử dòng dữ liệu (Data Flow testing) |
| **Definition-Use pair (du-pair)** | Cặp định nghĩa - sử dụng (du-pair) |
| **Cyclomatic complexity** | Độ phức tạp vòng (Cyclomatic complexity) |
| **Basis Path testing** | Kiểm thử đường cơ sở (Basis Path testing) |
| **Independent path** | Đường đi độc lập |
| **Input domain** | Miền đầu vào (Input domain) |
| **Output domain** | Miền đầu ra (Output domain) |
| **Oracle** | Oracle kiểm thử (Test Oracle) |
| **Check all that apply** | Chọn tất cả các đáp án phù hợp |

---

## Proposed Execution Steps

### Phase 1: Web Scraping and Extraction
1. **Access and Navigate:** Navigate to `https://www.coursera.org/learn/black-box-white-box-testing/home/module/1?isExternal=true` via the browser subagent.
2. **Session / Authentication Check:** Ensure we are logged in and have access to the quiz feedback views. If login is required, we will ask the user to verify the session or perform login.
3. **Discover Quiz Links:** Systematically visit the home page of each of the 4 modules:
   - Module 1: Introduction to Black-box and White-box Testing, BVA, EP
   - Module 2: Decision Tables, State Transitions
   - Module 3: White-box coverage criteria (Statement, Branch, Condition)
   - Module 4: Advanced white-box testing (MC/DC, CFG, Data Flow)
4. **Scrape Raw Data:** For each quiz link, go to the submission feedback page and execute our Javascript extraction function to fetch all raw questions, choices, answers, points, and feedbacks.
5. **Save Raw Data:** Save the raw JSON data to temporary files in the scratch directory.

### Phase 2: Formatting and Structuring
1. **Code Extraction:** Scan questions for code blocks, isolate them into a dedicated `"code"` field, and clean the `"question_text"`.
2. **Schema Matching:** Flatten the data structures to output `module_1.json` to `module_4.json` with the required schema:
   - `question_id`
   - `module`
   - `question_text`
   - `question_type`
   - `answers` (list of `{"answer_text": "...", "is_correct": true/false}`)
   - `code`

### Phase 3: English Translation Extraction & Professional Vietnamese Translation
1. **Extract Strings:** Run a python script to extract all unique English strings from the newly generated JSON files.
2. **Glossary-aligned Translation:** Translate all unique English strings into Vietnamese using Google Translate combined with the updated Black-box/White-box Glossary.
3. **Template Formatting:** Format the bilingual outputs:
   - Questions: `{English}\nVN: {Vietnamese}`
   - Options: `{English} ({Vietnamese})`
4. **Clean Residual Issues:** Run cleanup scripts to prevent double tags (e.g. `(SUT) (SUT)`) and nested parentheses (e.g. `(EP (Phân vùng tương đương))`).

### Phase 4: Validation and Release
1. Run structural schema validations.
2. Verify bilingual format completion (ensure 100% of items are translated).

---

## Verification Plan

### Automated Verification
- Run `validate_converted_json.py` to ensure schema conformance.
- Run `validate_translation.py` to ensure 100% bilingual mapping.

### Manual Verification
- Review the generated JSON files in the workspace editor to ensure translations read naturally and look correct.
